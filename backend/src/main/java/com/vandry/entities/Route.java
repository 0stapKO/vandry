package com.vandry.entities;

import com.vandry.entities.enums.Mode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "routes")
@NoArgsConstructor
@Getter @Setter
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double distance;

    @Column(nullable = false)
    private Long duration;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Mode mode;

    @ManyToOne
    @JoinColumn(nullable = false, name = "author_id")
    private User author;

    @ManyToMany
    @JoinTable(
            name = "route_collaborators",
            joinColumns = @JoinColumn(name = "route_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> collaborators = new HashSet<>();

    @OneToMany(orphanRemoval = true, cascade = CascadeType.ALL, mappedBy = "route")
    private List<RoutePoint> routePoints;
}
