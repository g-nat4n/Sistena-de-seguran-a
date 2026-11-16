package com.smartguard.dto.camera;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CameraRtspConfigRequest(
        @NotBlank @Size(max = 255) String host,
        @Min(1) @Max(65535) Integer port,
        @NotBlank @Size(max = 255) String path,
        @NotBlank @Size(max = 120) String username,
        /**
         * Senha em texto apenas na requisição de escrita.
         * Nunca é devolvida pela API. Se null/blank no update, mantém a senha atual.
         */
        @Size(max = 255) String password
) {
}
