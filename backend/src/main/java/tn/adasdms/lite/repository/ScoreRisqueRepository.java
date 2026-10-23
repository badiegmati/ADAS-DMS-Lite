package tn.adasdms.lite.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import tn.adasdms.lite.entity.ScoreRisque;

public interface ScoreRisqueRepository extends JpaRepository<ScoreRisque, UUID> {
}
