package com.vandry.dto;

import lombok.Data;
import java.util.List;

@Data
public class RouteRequest {
    private String name;
    private String transportMode;
    private Double distance;
    private Long duration;
    private List<RoutePointRequest> stops;
    private String description;
}