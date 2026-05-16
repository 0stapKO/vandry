package com.vandry.controllers;

import com.vandry.dto.RoutePointRequest;
import com.vandry.dto.RouteRequest;
import com.vandry.dto.RouteResponse;
import com.vandry.entities.Route;
import com.vandry.repositories.RouteRepository;
import com.vandry.services.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/route")
@CrossOrigin(origins = "http://localhost:5173")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @PostMapping
    public ResponseEntity<?> createRoute(@RequestBody RouteRequest request,
                                                     @RequestHeader("Authorization") String authHeader) {
        System.out.println("Отримано запит на створення нового маршруту: " + request.getName());
        try {
            Route savedRoute = routeService.saveRoute(request, authHeader);
            RouteResponse routeResponse = new RouteResponse();
            routeResponse.setId(savedRoute.getId());
            routeResponse.setName(savedRoute.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(routeResponse);
        }
        catch (RuntimeException e) {
            System.out.println(e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getMyRoutes(@RequestHeader("Authorization") String authHeader) {
        System.out.println("Отримано запит на отримання маршрутів користувача");
        try {
            List<Route> routes = routeService.getRoutes(authHeader);

            List<RouteResponse> responses = routes.stream().map(route -> {
                RouteResponse dto = new RouteResponse();
                dto.setId(route.getId());
                dto.setName(route.getName());
                dto.setDistance(route.getDistance());
                dto.setDuration(route.getDuration());
                dto.setTransportMode(route.getMode().name().toLowerCase());
                dto.setStopsCount(route.getRoutePoints() != null ? route.getRoutePoints().size() : 0);
                dto.setDescription(route.getDescription());
                dto.setIsBuiltIn(route.getIsBuiltIn());
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRouteById(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        try {
            Route route = routeService.getRouteById(id, authHeader);
            RouteResponse dto = new RouteResponse();
            dto.setId(route.getId());
            dto.setName(route.getName());
            dto.setDistance(route.getDistance());
            dto.setDuration(route.getDuration());
            dto.setTransportMode(route.getMode().name().toLowerCase());
            dto.setStopsCount(route.getRoutePoints() != null ? route.getRoutePoints().size() : 0);
            dto.setDescription(route.getDescription());
            dto.setIsBuiltIn(route.getIsBuiltIn());
            System.out.println("ISBUILTIN");
            System.out.println(route.getIsBuiltIn());
            // Конвертуємо точки бази даних у DTO
            List<RoutePointRequest> stops = route.getRoutePoints().stream().map(p -> {
                RoutePointRequest sp = new RoutePointRequest();
                sp.setPlaceId(p.getPlaceId());
                sp.setName(p.getName());
                sp.setAddress(p.getAddress());
                sp.setCategory(p.getCategory());
                sp.setLongitude(p.getLongitude());
                sp.setLatitude(p.getLatitude());
                sp.setStopOrder(p.getSequenceOrder());
                return sp;
            }).collect(Collectors.toList());

            // Важливо: сортуємо точки за порядком (stopOrder), щоб лінія будувалася правильно
            stops.sort((a, b) -> a.getStopOrder().compareTo(b.getStopOrder()));

            dto.setStops(stops);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoute(@PathVariable Long id,
                                         @RequestBody RouteRequest request,
                                         @RequestHeader("Authorization") String authHeader) {
        try {
            Route updatedRoute = routeService.updateRoute(id, request, authHeader);
            RouteResponse routeResponse = new RouteResponse();
            routeResponse.setId(updatedRoute.getId());
            routeResponse.setName(updatedRoute.getName());
            return ResponseEntity.ok(routeResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/built-in")
    public ResponseEntity<?> getBuiltInRoutes() {
        try {
            // Звертаємось напряму до репозиторію (або можеш винести це в RouteService)
            List<Route> builtInRoutes = routeService.getBuiltInRoutes();

            // Пакуємо в наші знайомі DTO
            List<RouteResponse> responses = builtInRoutes.stream().map(route -> {
                RouteResponse dto = new RouteResponse();
                dto.setId(route.getId());
                dto.setName(route.getName());
                dto.setDistance(route.getDistance());
                dto.setDuration(route.getDuration());
                dto.setTransportMode(route.getMode().name().toLowerCase());
                dto.setStopsCount(route.getRoutePoints() != null ? route.getRoutePoints().size() : 0);
                dto.setDescription(route.getDescription());
                dto.setIsBuiltIn(route.getIsBuiltIn());
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Помилка завантаження вбудованих маршрутів: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoute(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        try {
            routeService.deleteRoute(id, authHeader);
            return ResponseEntity.ok(Map.of("message", "Маршрут успішно видалено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicRouteById(@PathVariable Long id) {
        try {
            // Use service instead of repository
            Route route = routeService.getPublicRouteById(id);

            // Use proper DTO instead of HashMap
            RouteResponse dto = new RouteResponse();
            dto.setId(route.getId());
            dto.setName(route.getName());
            dto.setDistance(route.getDistance());
            dto.setDuration(route.getDuration());
            dto.setTransportMode(route.getMode().name().toLowerCase());
            dto.setStopsCount(route.getRoutePoints() != null ? route.getRoutePoints().size() : 0);
            dto.setDescription(route.getDescription());
            dto.setIsBuiltIn(route.getIsBuiltIn());

            // Convert DB points to DTOs
            List<RoutePointRequest> stops = route.getRoutePoints().stream().map(p -> {
                RoutePointRequest sp = new RoutePointRequest();
                sp.setPlaceId(p.getPlaceId());
                sp.setName(p.getName());
                sp.setAddress(p.getAddress());
                sp.setCategory(p.getCategory());
                sp.setLongitude(p.getLongitude());
                sp.setLatitude(p.getLatitude());
                sp.setStopOrder(p.getSequenceOrder());
                return sp;
            }).collect(Collectors.toList());

            // Sort stops by order to ensure correct line drawing
            stops.sort((a, b) -> a.getStopOrder().compareTo(b.getStopOrder()));

            dto.setStops(stops);
            return ResponseEntity.ok(dto);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
