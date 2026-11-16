package com.smartguard.entities;

import com.smartguard.entities.enums.CameraStatus;
import com.smartguard.entities.enums.CameraType;
import com.smartguard.entities.enums.StreamState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cameras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 60)
    private String identifier;

    @Column(nullable = false, length = 120)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CameraType type;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CameraStatus status;

    @Column(length = 500)
    private String demoMediaUrl;

    /**
     * URL montada sem credenciais (ex.: rtsp://host:554/cam/realmonitor?channel=1&subtype=0).
     * Credenciais ficam em campos separados e criptografados.
     */
    @Column(length = 500)
    private String rtspUrl;

    @Column(length = 255)
    private String rtspHost;

    private Integer rtspPort;

    @Column(length = 255)
    private String rtspPath;

    @Column(length = 120)
    private String rtspUsername;

    @Column(columnDefinition = "TEXT")
    private String rtspPasswordEnc;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StreamState streamState = StreamState.IDLE;

    private Instant lastSeenAt;

    private Instant lastTestedAt;

    @Column(length = 500)
    private String lastError;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (streamState == null) {
            streamState = StreamState.IDLE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean hasRtspCredentials() {
        return rtspHost != null && !rtspHost.isBlank()
                && rtspUsername != null && !rtspUsername.isBlank()
                && rtspPasswordEnc != null && !rtspPasswordEnc.isBlank();
    }
}
