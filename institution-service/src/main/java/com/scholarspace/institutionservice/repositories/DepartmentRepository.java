package com.scholarspace.institutionservice.repositories;

import com.scholarspace.institutionservice.models.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByCode(String code);
    List<Department> findByInstitution_InstitutionId(Long institutionId);
    long countByInstitution_InstitutionId(Long institutionId);
}