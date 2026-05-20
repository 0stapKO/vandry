package com.vandry.repositories;

import com.vandry.entities.Route;
import com.vandry.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findAllByAuthor(User author);
    List<Route> findAllByIsBuiltInTrue();
}