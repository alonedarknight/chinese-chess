package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "tblLobby")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lobby {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer totalRoom;

    @JsonIgnore
    @OneToMany(mappedBy = "lobby", cascade = CascadeType.ALL)
    private List<Room> rooms;
}
