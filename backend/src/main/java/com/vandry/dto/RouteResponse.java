package com.vandry.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
public class RouteResponse {
    private Long id;
    private String name;
    private String message;
    private Double distance;
    private Long duration;
    private String transportMode;
    private Integer stopsCount;
    private List<RoutePointRequest> stops;
    private String description;
    private Boolean isBuiltIn;
}
