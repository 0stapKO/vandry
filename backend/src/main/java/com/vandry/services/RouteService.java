package com.vandry.services;

import com.vandry.dto.RoutePointRequest;
import com.vandry.dto.RouteRequest;
import com.vandry.entities.Route;
import com.vandry.entities.RoutePoint;
import com.vandry.entities.User;
import com.vandry.entities.enums.Mode;
import com.vandry.repositories.RouteRepository;
import com.vandry.repositories.UserRepository;
import com.vandry.security.JwtService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RouteService {
    private final RouteRepository routeRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public RouteService(RouteRepository routeRepository, UserRepository userRepository, JwtService jwtService) {
        this.routeRepository = routeRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public List<Route> getRoutes(String authHeader) {
        User author = getUserFromToken(authHeader);
        return routeRepository.findAllByAuthor(author);
    }

    public List<Route> getBuiltInRoutes() {
        return routeRepository.findAllByIsBuiltInTrue();
    }

    @Transactional
    public Route saveRoute(RouteRequest request, String authHeader) {
        User author = getUserFromToken(authHeader);
        Route route = new Route();
        route.setName(request.getName());
        route.setMode(Mode.valueOf(request.getTransportMode().toUpperCase()));
        route.setDistance(request.getDistance());
        route.setDuration(request.getDuration());
        route.setAuthor(author);
        route.setDescription(request.getDescription());

        if (request.getStops() != null) {
            List<RoutePoint> points = request.getStops().stream().map(dto -> {
                RoutePoint point = new RoutePoint();
                point.setPlaceId(dto.getPlaceId());
                point.setName(dto.getName());
                point.setAddress(dto.getAddress());
                point.setCategory(dto.getCategory());
                point.setLongitude(dto.getLongitude());
                point.setLatitude(dto.getLatitude());
                point.setSequenceOrder(dto.getStopOrder());

                point.setRoute(route);
                return point;
            }).collect(Collectors.toList());

            route.setRoutePoints(points);
        }

        return routeRepository.save(route);
    }

    @Transactional
    public Route updateRoute(Long routeId, RouteRequest request, String authHeader) {
        User author = getUserFromToken(authHeader);

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Маршрут не знайдено"));

        if (!route.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("У вас немає доступу до цього маршруту");
        }

        route.setName(request.getName());
        route.setMode(Mode.valueOf(request.getTransportMode().toUpperCase()));
        route.setDistance(request.getDistance());
        route.setDuration(request.getDuration());
        route.setDescription(request.getDescription());

        route.getRoutePoints().clear();

        if (request.getStops() != null) {
            List<RoutePoint> newPoints = request.getStops().stream().map(dto -> {
                RoutePoint point = new RoutePoint();
                point.setPlaceId(dto.getPlaceId());
                point.setName(dto.getName());
                point.setAddress(dto.getAddress());
                point.setCategory(dto.getCategory());
                point.setLongitude(dto.getLongitude());
                point.setLatitude(dto.getLatitude());
                point.setSequenceOrder(dto.getStopOrder());
                point.setRoute(route);
                return point;
            }).collect(Collectors.toList());

            route.getRoutePoints().addAll(newPoints);
        }

        return routeRepository.save(route);
    }

    @Transactional
    public void deleteRoute(Long routeId, String authHeader) {
        User author = getUserFromToken(authHeader);

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Маршрут не знайдено"));

        if (!route.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("У вас немає доступу до цього маршруту");
        }

        routeRepository.delete(route);
    }

    public Route getRouteById(Long routeId, String authHeader) {
        User author = getUserFromToken(authHeader);
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Маршрут не знайдено"));

        boolean isOwner = route.getAuthor() != null && route.getAuthor().getId().equals(author.getId());

        if (!route.getIsBuiltIn() && !isOwner) {
            throw new RuntimeException("У вас немає доступу до цього маршруту");
        }
        return route;
    }

    private User getUserFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid token format");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Route getPublicRouteById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found"));
    }
}