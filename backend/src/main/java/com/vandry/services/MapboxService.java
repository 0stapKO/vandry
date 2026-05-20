package com.vandry.services;

import com.vandry.entities.RoutePoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MapboxService {

    @Value("${mapbox.api.key}")
    private String mapboxApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public double[][] getDurationMatrix(List<RoutePoint> stops) {
        String coordinates = stops.stream()
                .map(stop -> stop.getLongitude() + "," + stop.getLatitude())
                .collect(Collectors.joining(";"));

        String url = String.format(
                "https://api.mapbox.com/directions-matrix/v1/mapbox/driving/%s?annotations=duration&access_token=%s",
                coordinates, mapboxApiKey
        );

        MapboxMatrixResponse response = restTemplate.getForObject(url, MapboxMatrixResponse.class);

        if (response == null || response.durations == null) {
            throw new RuntimeException("Не вдалося отримати матрицю від Mapbox");
        }

        return response.durations;
    }

    public static class MapboxMatrixResponse {
        public String code;
        public double[][] durations;
    }
}
