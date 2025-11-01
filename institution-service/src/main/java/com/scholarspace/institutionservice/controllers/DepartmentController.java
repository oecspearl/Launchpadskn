package com.scholarspace.institutionservice.controllers;

import com.scholarspace.institutionservice.models.Department;
import com.scholarspace.institutionservice.services.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@Tag(name = "Department Management", description = "APIs for managing academic departments within institutions. Departments belong to institutions and serve as organizational units for courses. Only administrators can create, update, or delete departments.")
public class DepartmentController {
    
    private final DepartmentService departmentService;

    @PostMapping
    @Operation(
        summary = "Create a new academic department",
        description = "Creates a new department within an existing institution. Departments are organizational units that will contain courses. Each department must have a unique code within the institution and must be associated with a valid institution. Only administrators can perform this operation."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Department created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Department.class),
                examples = @ExampleObject(
                    name = "Created Department",
                    value = "{\"departmentId\": 1, \"name\": \"Computer Science\", \"code\": \"CS\", \"description\": \"Department of Computer Science and Engineering\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid input data, department code already exists, or institution not found",
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "Duplicate Code Error",
                        value = "{\"error\": \"Department code 'CS' already exists in this institution\"}"
                    ),
                    @ExampleObject(
                        name = "Institution Not Found",
                        value = "{\"error\": \"Institution with ID 999 not found\"}"
                    )
                }
            )
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Only administrators can create departments"
        )
    })
    public ResponseEntity<?> createDepartment(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Department details to create. All fields are required except description.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "Computer Science Department",
                        value = "{\"name\": \"Computer Science\", \"code\": \"CS\", \"description\": \"Department of Computer Science and Engineering\", \"institutionId\": 1}"
                    ),
                    @ExampleObject(
                        name = "Mathematics Department",
                        value = "{\"name\": \"Mathematics\", \"code\": \"MATH\", \"description\": \"Department of Pure and Applied Mathematics\", \"institutionId\": 1}"
                    ),
                    @ExampleObject(
                        name = "Minimal Example",
                        value = "{\"name\": \"Physics\", \"code\": \"PHYS\", \"description\": \"\", \"institutionId\": 1}"
                    )
                }
            )
        )
        @RequestBody Map<String, Object> departmentRequest) {
        try {
            String name = (String) departmentRequest.get("name");
            String code = (String) departmentRequest.get("code");
            String description = (String) departmentRequest.get("description");
            Long institutionId = Long.valueOf(departmentRequest.get("institutionId").toString());
            
            Department department = departmentService.createDepartment(name, code, description, institutionId);
            return ResponseEntity.ok(department);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Server error: " + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(
        summary = "Retrieve all departments",
        description = "Fetches a complete list of all academic departments across all institutions in the system. Each department includes its associated institution information. This endpoint is useful for administrators to view all departments and for populating dropdown lists in the frontend."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Successfully retrieved all departments",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Department.class),
                examples = @ExampleObject(
                    name = "Departments List",
                    value = "[{\"departmentId\": 1, \"name\": \"Computer Science\", \"code\": \"CS\", \"description\": \"Department of Computer Science\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-15T10:30:00\"}, {\"departmentId\": 2, \"name\": \"Mathematics\", \"code\": \"MATH\", \"description\": \"Department of Mathematics\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-16T14:20:00\"}]"
                )
            )
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Authentication required"
        )
    })
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get department by ID",
        description = "Retrieves detailed information about a specific department using its unique identifier. The response includes the department details along with its associated institution information. This is useful when you need complete information about a particular department."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Department found and returned successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Department.class),
                examples = @ExampleObject(
                    name = "Department Details",
                    value = "{\"departmentId\": 1, \"name\": \"Computer Science\", \"code\": \"CS\", \"description\": \"Department of Computer Science and Engineering\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\", \"location\": \"Cambridge, MA\"}, \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Department not found with the provided ID"
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid ID format - ID must be a positive number"
        )
    })
    public ResponseEntity<?> getDepartmentById(
        @Parameter(
            description = "Unique identifier of the department to retrieve. Must be a positive integer.",
            example = "1",
            required = true
        )
        @PathVariable Long id) {
        Optional<Department> department = departmentService.getDepartmentById(id);
        return department.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    @Operation(
        summary = "Find department by code",
        description = "Searches for a department using its unique code. Department codes are typically short abbreviations (e.g., 'CS' for Computer Science, 'MATH' for Mathematics). This endpoint performs case-sensitive matching and is useful for finding departments when you know the code but not the ID."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Department found with matching code",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Department.class),
                examples = @ExampleObject(
                    name = "Found Department",
                    value = "{\"departmentId\": 1, \"name\": \"Computer Science\", \"code\": \"CS\", \"description\": \"Department of Computer Science and Engineering\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "No department found with the provided code"
        )
    })
    public ResponseEntity<?> getDepartmentByCode(
        @Parameter(
            description = "Department code to search for. Usually a short abbreviation (e.g., 'CS', 'MATH', 'PHYS'). Search is case-sensitive.",
            example = "CS",
            required = true
        )
        @PathVariable String code) {
        Optional<Department> department = departmentService.getDepartmentByCode(code);
        return department.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/institution/{institutionId}")
    @Operation(
        summary = "Get all departments in an institution",
        description = "Retrieves all departments that belong to a specific institution. This is particularly useful when you want to see the organizational structure of an institution or when populating department dropdowns for a specific institution. Results are ordered by department name."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Successfully retrieved departments for the institution",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Department.class),
                examples = @ExampleObject(
                    name = "Institution Departments",
                    value = "[{\"departmentId\": 1, \"name\": \"Computer Science\", \"code\": \"CS\", \"description\": \"Department of Computer Science\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-15T10:30:00\"}, {\"departmentId\": 2, \"name\": \"Mathematics\", \"code\": \"MATH\", \"description\": \"Department of Mathematics\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-16T14:20:00\"}]"
                )
            )
        ),
        @ApiResponse(
            responseCode = "200", 
            description = "Institution exists but has no departments (empty array returned)",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "No Departments",
                    value = "[]"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid institution ID format"
        )
    })
    public ResponseEntity<List<Department>> getDepartmentsByInstitution(
        @Parameter(
            description = "ID of the institution to get departments for. Must be a positive integer.",
            example = "1",
            required = true
        )
        @PathVariable Long institutionId) {
        return ResponseEntity.ok(departmentService.getDepartmentsByInstitution(institutionId));
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Update department information",
        description = "Updates an existing department's details. You can update the name and description, but the department code and institution cannot be changed after creation. Only provide the fields you want to update - other fields will remain unchanged. Only administrators can perform this operation."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Department updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Department.class),
                examples = @ExampleObject(
                    name = "Updated Department",
                    value = "{\"departmentId\": 1, \"name\": \"Computer Science and Engineering\", \"code\": \"CS\", \"description\": \"Updated description for Computer Science department\", \"institution\": {\"institutionId\": 1, \"name\": \"Harvard University\"}, \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Department not found with the provided ID"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Only administrators can update departments"
        )
    })
    public ResponseEntity<?> updateDepartment(
        @Parameter(
            description = "ID of the department to update",
            example = "1",
            required = true
        )
        @PathVariable Long id, 
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Department fields to update. Note: code and institution cannot be changed after creation.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "Update Name and Description",
                        value = "{\"name\": \"Computer Science and Engineering\", \"description\": \"Updated description for the department\"}"
                    ),
                    @ExampleObject(
                        name = "Update Only Name",
                        value = "{\"name\": \"Computer Science and AI\"}"
                    ),
                    @ExampleObject(
                        name = "Update Only Description",
                        value = "{\"description\": \"Department focusing on modern computing technologies\"}"
                    )
                }
            )
        )
        @RequestBody Department departmentDetails) {
        Optional<Department> existingDepartment = departmentService.getDepartmentById(id);
        
        if (existingDepartment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Department department = existingDepartment.get();
        
        if (departmentDetails.getName() != null) {
            department.setName(departmentDetails.getName());
        }
        if (departmentDetails.getDescription() != null) {
            department.setDescription(departmentDetails.getDescription());
        }
        
        Department updatedDepartment = departmentService.updateDepartment(department);
        return ResponseEntity.ok(updatedDepartment);
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete a department",
        description = "Permanently removes a department from the system. ⚠️ WARNING: This action cannot be undone! Deleting a department will also affect all courses associated with it. Only administrators can perform this operation. Use with extreme caution."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Department deleted successfully",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Success Response",
                    value = "{\"message\": \"Department deleted successfully\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Cannot delete department - it may have associated courses or other dependencies",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error Response",
                    value = "{\"error\": \"Cannot delete department with existing courses\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Department not found with the provided ID"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Only administrators can delete departments"
        )
    })
    public ResponseEntity<?> deleteDepartment(
        @Parameter(
            description = "ID of the department to delete. ⚠️ This action is permanent and cannot be undone!",
            example = "1",
            required = true
        )
        @PathVariable Long id) {
        try {
            departmentService.deleteDepartment(id);
            return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/stats")
    @Operation(
        summary = "Get department statistics",
        description = "Retrieves comprehensive statistics for a specific department including course count and enrollment numbers."
    )
    @ApiResponse(responseCode = "200", description = "Department statistics retrieved successfully")
    public ResponseEntity<Map<String, Object>> getDepartmentStats(
        @Parameter(description = "Department ID", example = "1")
        @PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentStats(id));
    }
}