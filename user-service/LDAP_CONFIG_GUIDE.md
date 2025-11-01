# Active Directory Configuration Guide

## 1. Fix AD User Accounts

Remove the `mailto:` prefix from userPrincipalName:

```powershell
# Fix existing users
Set-ADUser -Identity "jadmin" -UserPrincipalName "jadmin@mylab.local"
Set-ADUser -Identity "sinstructor" -UserPrincipalName "sinstructor@mylab.local"
Set-ADUser -Identity "mstudent" -UserPrincipalName "mstudent@mylab.local"

# Verify the changes
Get-ADUser -Filter "SamAccountName -like '*admin' -or SamAccountName -like '*instructor' -or SamAccountName -like '*student'" -Properties UserPrincipalName | Select-Object Name, SamAccountName, UserPrincipalName
```

## 2. Update application.yml

```yaml
ldap:
  url: ldap://192.168.154.5:389
  base: DC=mylab,DC=local
  username: CN=scholarspace-svc,CN=Users,DC=mylab,DC=local
  password: ServicePass123!
  userSearchBase: CN=Users,DC=mylab,DC=local
  userSearchFilter: (|(userPrincipalName={0})(sAMAccountName={0}))
  groupSearchBase: CN=Users,DC=mylab,DC=local
  groupRoleAttribute: cn
```

## 3. Add Missing Dependencies

Add to pom.xml:

```xml
<dependency>
    <groupId>org.springframework.ldap</groupId>
    <artifactId>spring-ldap-core</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-ldap</artifactId>
</dependency>
```

## 4. Enable Configuration Properties

Add to UserServiceApplication.java:

```java
@SpringBootApplication
@EnableConfigurationProperties(LdapConfig.class)
public class UserServiceApplication {
    // ...
}
```

## 5. Test LDAP Connection

Create a test endpoint to verify LDAP connectivity:

```java
@GetMapping("/test-ldap")
public ResponseEntity<?> testLdap() {
    try {
        // Test service account binding
        LdapContext ctx = new InitialLdapContext(env, null);
        ctx.close();
        return ResponseEntity.ok("LDAP connection successful");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("LDAP error: " + e.getMessage());
    }
}
```

## 6. Debugging Steps

1. **Test Network Connectivity**:
   ```bash
   telnet 192.168.154.5 389
   ```

2. **Test Service Account**:
   ```powershell
   # On AD server
   Get-ADUser -Identity "scholarspace-svc" -Properties *
   ```

3. **Enable Debug Logging**:
   ```yaml
   logging:
     level:
       org.springframework.ldap: DEBUG
       javax.naming: DEBUG
   ```

## 7. Common AD Authentication Patterns

### Pattern 1: Direct Bind (Recommended)
1. Search for user DN using service account
2. Bind with user DN and password
3. Query group memberships

### Pattern 2: Service Account Validation
1. Bind with service account
2. Search and validate user credentials
3. Query group memberships

## 8. Security Considerations

- Use secure LDAP (LDAPS) on port 636 in production
- Limit service account permissions to read-only
- Implement connection pooling
- Add proper error handling and logging
- Use connection timeouts