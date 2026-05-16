package com.vandry.repositories;

import com.vandry.entities.Route;
import com.vandry.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    // Changed from "findAllByUser" to match the "author" field in Route entity
    List<Route> findAllByAuthor(User author);
    List<Route> findAllByIsBuiltInTrue();
}