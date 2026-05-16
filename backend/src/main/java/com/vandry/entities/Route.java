package com.vandry.entities;

import com.vandry.entities.enums.Mode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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
    @JoinColumn(nullable = true, name = "author_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User author;

    @Column(name = "is_built_in", nullable = false)
    private Boolean isBuiltIn = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany
    @JoinTable(
            name = "route_collaborators",
            joinColumns = @JoinColumn(
                    name = "route_id",
                    foreignKey = @ForeignKey(name = "fk_route_collab_route", foreignKeyDefinition = "FOREIGN KEY (route_id) REFERENCES routes ON DELETE CASCADE")
            ),
            inverseJoinColumns = @JoinColumn(
                    name = "user_id",
                    foreignKey = @ForeignKey(name = "fk_route_collab_user", foreignKeyDefinition = "FOREIGN KEY (user_id) REFERENCES users ON DELETE CASCADE")
            )
    )
    private Set<User> collaborators = new HashSet<>();

    @OneToMany(orphanRemoval = true, cascade = CascadeType.ALL, mappedBy = "route")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<RoutePoint> routePoints;
}
