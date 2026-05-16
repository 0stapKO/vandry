package com.vandry.dto;

import lombok.Data;

@Data
public class RoutePointRequest {
    private String placeId;
    private String name;
    private String address;
    private String category;
    private Double longitude;
    private Double latitude;
    private Integer stopOrder;
}