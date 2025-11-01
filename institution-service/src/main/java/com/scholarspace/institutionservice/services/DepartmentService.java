package com.scholarspace.institutionservice.services;

import com.scholarspace.institutionservice.models.Department;
import com.scholarspace.institutionservice.models.Institution;
import com.scholarspace.institutionservice.repositories.DepartmentRepository;
import com.scholarspace.institutionservice.repositories.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final InstitutionRepository institutionRepository;
    private final RestTemplate restTemplate;

    public Department createDepartment(String name, String code, String description, Long institutionId) {
        if (departmentRepository.findByCode(code).isPresent()) {
            throw new RuntimeException("Department code already exists");
        }
        
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found"));
        
        Department department = new Department();
        department.setName(name);
        department.setCode(code);
        department.setDescription(description);
        department.setInstitution(institution);
        department.setCreatedAt(LocalDateTime.now());
        
        return departmentRepository.save(department);
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    public Optional<Department> getDepartmentByCode(String code) {
        return departmentRepository.findByCode(code);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public List<Department> getDepartmentsByInstitution(Long institutionId) {
        return departmentRepository.findByInstitution_InstitutionId(institutionId);
    }

    public Department updateDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long departmentId) {
        departmentRepository.deleteById(departmentId);
    }

    public Map<String, Object> getDepartmentStats(Long departmentId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Get course count from course-service
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> courseStats = restTemplate.getForObject(
                "http://course-service/api/courses/department/" + departmentId + "/stats", 
                Map.class
            );
            if (courseStats != null) {
                stats.putAll(courseStats);
            }
        } catch (Exception e) {
            stats.put("courseCount", 0);
            stats.put("enrollmentCount", 0);
        }
        
        return stats;
    }
}