package com.scholarspace.institutionservice.controllers;

import com.scholarspace.institutionservice.models.Department;
import com.scholarspace.institutionservice.models.Institution;
import com.scholarspace.institutionservice.services.InstitutionService;
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
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
@Tag(name = "Institution Management", description = "APIs for managing educational institutions. Only administrators can create, update, or delete institutions. Institutions serve as the top-level organizational unit that contains departments.")
public class InstitutionController {
    
    private final InstitutionService institutionService;

    @PostMapping
    @Operation(
        summary = "Create a new educational institution",
        description = "Creates a new institution in the system. This is typically the first step when setting up a new educational organization. Only administrators can perform this operation. The institution will serve as a container for departments and courses."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Institution created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Institution.class),
                examples = @ExampleObject(
                    name = "Created Institution",
                    value = "{\"institutionId\": 1, \"name\": \"Harvard University\", \"location\": \"Cambridge, MA\", \"contact\": \"admin@harvard.edu\", \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid input data or institution name already exists",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error Response",
                    value = "{\"error\": \"Institution name already exists\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Only administrators can create institutions"
        )
    })
    public ResponseEntity<?> createInstitution(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Institution details to create. All fields are required except contact which is optional.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "University Example",
                        value = "{\"name\": \"Harvard University\", \"location\": \"Cambridge, MA\", \"contact\": \"admin@harvard.edu\"}"
                    ),
                    @ExampleObject(
                        name = "College Example",
                        value = "{\"name\": \"MIT\", \"location\": \"Cambridge, MA\", \"contact\": \"info@mit.edu\"}"
                    ),
                    @ExampleObject(
                        name = "Minimal Example",
                        value = "{\"name\": \"Local Community College\", \"location\": \"Downtown\", \"contact\": \"\"}"
                    )
                }
            )
        )
        @RequestBody Map<String, String> institutionRequest) {
        try {
            String name = institutionRequest.get("name");
            String location = institutionRequest.get("location");
            String contact = institutionRequest.get("contact");
            
            Institution institution = institutionService.createInstitution(name, location, contact);
            return ResponseEntity.ok(institution);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(
        summary = "Retrieve all institutions",
        description = "Fetches a complete list of all educational institutions in the system. This endpoint is useful for administrators to view all registered institutions and for populating dropdown lists in the frontend. Results are ordered by creation date."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Successfully retrieved all institutions",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Institution.class),
                examples = @ExampleObject(
                    name = "Institutions List",
                    value = "[{\"institutionId\": 1, \"name\": \"Harvard University\", \"location\": \"Cambridge, MA\", \"contact\": \"admin@harvard.edu\", \"createdAt\": \"2024-01-15T10:30:00\"}, {\"institutionId\": 2, \"name\": \"MIT\", \"location\": \"Cambridge, MA\", \"contact\": \"info@mit.edu\", \"createdAt\": \"2024-01-16T14:20:00\"}]"
                )
            )
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Authentication required"
        )
    })
    public ResponseEntity<List<Institution>> getAllInstitutions() {
        return ResponseEntity.ok(institutionService.getAllInstitutions());
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get institution by ID",
        description = "Retrieves detailed information about a specific institution using its unique identifier. This is useful when you need complete information about a particular institution, such as when editing institution details or viewing institution profile."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Institution found and returned successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Institution.class),
                examples = @ExampleObject(
                    name = "Institution Details",
                    value = "{\"institutionId\": 1, \"name\": \"Harvard University\", \"location\": \"Cambridge, MA\", \"contact\": \"admin@harvard.edu\", \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Institution not found with the provided ID"
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid ID format - ID must be a positive number"
        )
    })
    public ResponseEntity<?> getInstitutionById(
        @Parameter(
            description = "Unique identifier of the institution to retrieve. Must be a positive integer.",
            example = "1",
            required = true
        )
        @PathVariable Long id) {
        Optional<Institution> institution = institutionService.getInstitutionById(id);
        return institution.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Find institution by name",
        description = "Searches for an institution using its exact name. This endpoint performs case-sensitive matching. Useful for verifying if an institution already exists before creating a new one, or for finding institutions when you know the name but not the ID."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Institution found with matching name",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Institution.class),
                examples = @ExampleObject(
                    name = "Found Institution",
                    value = "{\"institutionId\": 1, \"name\": \"Harvard University\", \"location\": \"Cambridge, MA\", \"contact\": \"admin@harvard.edu\", \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "No institution found with the provided name"
        )
    })
    public ResponseEntity<?> getInstitutionByName(
        @Parameter(
            description = "Exact name of the institution to search for. Search is case-sensitive.",
            example = "Harvard University",
            required = true
        )
        @PathVariable String name) {
        Optional<Institution> institution = institutionService.getInstitutionByName(name);
        return institution.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Update institution information",
        description = "Updates an existing institution's details. You can update any combination of name, location, and contact information. Only provide the fields you want to update - other fields will remain unchanged. Only administrators can perform this operation."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Institution updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Institution.class),
                examples = @ExampleObject(
                    name = "Updated Institution",
                    value = "{\"institutionId\": 1, \"name\": \"Harvard University\", \"location\": \"Cambridge, Massachusetts\", \"contact\": \"newadmin@harvard.edu\", \"createdAt\": \"2024-01-15T10:30:00\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Institution not found with the provided ID"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Only administrators can update institutions"
        )
    })
    public ResponseEntity<?> updateInstitution(
        @Parameter(
            description = "ID of the institution to update",
            example = "1",
            required = true
        )
        @PathVariable Long id, 
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Institution fields to update. Only include fields you want to change.",
            required = true,
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @ExampleObject(
                        name = "Update All Fields",
                        value = "{\"name\": \"Harvard University\", \"location\": \"Cambridge, Massachusetts\", \"contact\": \"newadmin@harvard.edu\"}"
                    ),
                    @ExampleObject(
                        name = "Update Only Contact",
                        value = "{\"contact\": \"updated@harvard.edu\"}"
                    ),
                    @ExampleObject(
                        name = "Update Name and Location",
                        value = "{\"name\": \"Harvard University (Updated)\", \"location\": \"Cambridge, MA, USA\"}"
                    )
                }
            )
        )
        @RequestBody Institution institutionDetails) {
        try {
            Optional<Institution> existingInstitution = institutionService.getInstitutionById(id);
            
            if (existingInstitution.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Institution institution = existingInstitution.get();
            
            if (institutionDetails.getName() != null) {
                institution.setName(institutionDetails.getName());
            }
            if (institutionDetails.getLocation() != null) {
                institution.setLocation(institutionDetails.getLocation());
            }
            if (institutionDetails.getContact() != null) {
                institution.setContact(institutionDetails.getContact());
            }
            if (institutionDetails.getPhone() != null) {
                institution.setPhone(institutionDetails.getPhone());
            }
            if (institutionDetails.getWebsite() != null) {
                institution.setWebsite(institutionDetails.getWebsite());
            }
            if (institutionDetails.getEstablishedYear() != null) {
                institution.setEstablishedYear(institutionDetails.getEstablishedYear());
            }
            if (institutionDetails.getType() != null) {
                institution.setType(institutionDetails.getType());
            }
            
            Institution updatedInstitution = institutionService.updateInstitution(institution);
            return ResponseEntity.ok(updatedInstitution);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete an institution",
        description = "Permanently removes an institution from the system. ⚠️ WARNING: This action cannot be undone! Deleting an institution will also remove all associated departments and may affect courses. Only administrators can perform this operation. Use with extreme caution."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Institution deleted successfully",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Success Response",
                    value = "{\"message\": \"Institution deleted successfully\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Cannot delete institution - it may have associated departments or courses",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error Response",
                    value = "{\"error\": \"Cannot delete institution with existing departments\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Institution not found with the provided ID"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Only administrators can delete institutions"
        )
    })
    public ResponseEntity<?> deleteInstitution(
        @Parameter(
            description = "ID of the institution to delete. ⚠️ This action is permanent and cannot be undone!",
            example = "1",
            required = true
        )
        @PathVariable Long id) {
        try {
            institutionService.deleteInstitution(id);
            return ResponseEntity.ok(Map.of("message", "Institution deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/departments")
    @Operation(
        summary = "Get departments by institution",
        description = "Retrieves all departments belonging to a specific institution."
    )
    @ApiResponse(responseCode = "200", description = "Departments retrieved successfully")
    public ResponseEntity<List<Department>> getDepartmentsByInstitution(
        @Parameter(description = "Institution ID", example = "1")
        @PathVariable Long id) {
        return ResponseEntity.ok(institutionService.getDepartmentsByInstitution(id));
    }

    @GetMapping("/{id}/stats")
    @Operation(
        summary = "Get institution statistics",
        description = "Retrieves comprehensive statistics for a specific institution including department count, course count, and student count."
    )
    @ApiResponse(responseCode = "200", description = "Institution statistics retrieved successfully")
    public ResponseEntity<Map<String, Object>> getInstitutionStats(
        @Parameter(description = "Institution ID", example = "1")
        @PathVariable Long id) {
        return ResponseEntity.ok(institutionService.getInstitutionStats(id));
    }
}