# Setup Java (JDK) for LaunchPad SKN

## ⚠️ Java Not Found

Your system needs **Java JDK 17 or higher** to run the Spring Boot backend services.

---

## 🚀 Quick Fix Options

### Option 1: Install Java JDK (Recommended)

#### Step 1: Download Java JDK 17 or higher

**Option A: Oracle JDK**
- Go to: https://www.oracle.com/java/technologies/downloads/#java17
- Download Windows x64 Installer
- Run the installer

**Option B: OpenJDK (Free & Recommended)**
- Go to: https://adoptium.net/temurin/releases/
- Select:
  - Version: **17** or **21** (LTS recommended)
  - Operating System: **Windows**
  - Architecture: **x64**
  - Package Type: **JDK**
- Download and run installer

#### Step 2: Install Java

1. Run the downloaded installer
2. Follow installation wizard
3. **Important:** Note the installation path (usually `C:\Program Files\Java\jdk-17` or similar)
4. Complete installation

#### Step 3: Set JAVA_HOME Environment Variable

**Method 1: Using PowerShell (Temporary - Current Session)**
```powershell
# Replace with your actual Java installation path
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

**Method 2: Using Windows GUI (Permanent)**
1. Press `Win + X` → **System**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under **System variables**, click **New**
5. Variable name: `JAVA_HOME`
6. Variable value: `C:\Program Files\Java\jdk-17` (your actual path)
7. Click **OK**
8. Find **Path** in System variables, click **Edit**
9. Click **New**, add: `%JAVA_HOME%\bin`
10. Click **OK** on all dialogs
11. **Restart your terminal/PowerShell** for changes to take effect

#### Step 4: Verify Installation

```powershell
java -version
javac -version
echo $env:JAVA_HOME
```

You should see:
```
java version "17.0.x" (or higher)
JAVA_HOME = C:\Program Files\Java\jdk-17
```

---

### Option 2: Use Maven Wrapper (If Java is Already Installed Elsewhere)

If Java is installed but not in PATH, you can find it and set JAVA_HOME:

**Find Java Installation:**
```powershell
# Check common locations
Get-ChildItem "C:\Program Files\Java" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files (x86)\Java" -ErrorAction SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\Programs\Java" -ErrorAction SilentlyContinue
```

Once you find it, set JAVA_HOME:
```powershell
$env:JAVA_HOME="C:\path\to\your\java\installation"
```

---

## 🔍 Verify Setup

After installing/setting up Java, verify:

```powershell
java -version
# Should show: java version "17.x.x" or higher

echo $env:JAVA_HOME
# Should show: C:\Program Files\Java\jdk-17 (or your path)
```

---

## ✅ After Java is Setup

1. **Verify Java works:**
   ```powershell
   java -version
   ```

2. **Start services:**
   ```powershell
   .\start-all-services.bat
   ```

3. **Services should now start successfully!**

---

## 🆘 Troubleshooting

**"java is not recognized"**
- Java not installed → Install Java (Option 1)
- Java installed but not in PATH → Set JAVA_HOME and add to PATH

**"JAVA_HOME is not defined"**
- Set JAVA_HOME environment variable (see Step 3 above)
- Restart terminal after setting

**Wrong Java version**
- Need JDK 17+ (not JRE)
- Download JDK (not JRE) from Oracle or Adoptium

---

**Once Java is installed and configured, you can start the backend services!**


