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

        // 1. Map DTO to Route Entity
        Route route = new Route();
        route.setName(request.getName()); // React "title" -> Entity "name"

        // Convert string like "driving" to enum DRIVING
        route.setMode(Mode.valueOf(request.getTransportMode().toUpperCase()));
        route.setDistance(request.getDistance());
        route.setDuration(request.getDuration());
        route.setAuthor(author); // Entity uses "author" instead of "user"
        route.setDescription(request.getDescription());

        // 2. Map stops from DTO to RoutePoint Entities
        if (request.getStops() != null) {
            List<RoutePoint> points = request.getStops().stream().map(dto -> {
                RoutePoint point = new RoutePoint();
                // Make sure your RoutePoint entity has these setters!
                point.setPlaceId(dto.getPlaceId());
                point.setName(dto.getName());
                point.setAddress(dto.getAddress());
                point.setCategory(dto.getCategory());
                point.setLongitude(dto.getLongitude());
                point.setLatitude(dto.getLatitude());
                point.setSequenceOrder(dto.getStopOrder());

                point.setRoute(route); // Bidirectional relationship
                return point;
            }).collect(Collectors.toList());

            route.setRoutePoints(points); // Entity uses "routePoints"
        }

        // 3. Save to database
        return routeRepository.save(route);
    }

    @Transactional
    public Route updateRoute(Long routeId, RouteRequest request, String authHeader) {
        User author = getUserFromToken(authHeader);

        // Знаходимо існуючий маршрут
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Маршрут не знайдено"));

        // Перевіряємо, чи він належить цьому користувачу
        if (!route.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("У вас немає доступу до цього маршруту");
        }

        // 1. Оновлюємо базові дані
        route.setName(request.getName()); // або getTitle(), залежно від твого DTO
        route.setMode(Mode.valueOf(request.getTransportMode().toUpperCase()));
        route.setDistance(request.getDistance());
        route.setDuration(request.getDuration());
        route.setDescription(request.getDescription());

        // 2. Очищаємо старі точки
        route.getRoutePoints().clear();

        // 3. Додаємо нові точки
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
                point.setRoute(route); // Відновлюємо зв'язок
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

        // Перевіряємо, чи маршрут належить тому, хто його намагається видалити
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
        // Corrected method name to match your JwtService
        String email = jwtService.extractEmail(token);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Route getPublicRouteById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found"));
    }
}