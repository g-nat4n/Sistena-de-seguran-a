package com.smartguard.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Em modo server, rejeita IPs fora das CIDRs da LAN.
 * Em standalone, o bind já é 127.0.0.1.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class LanAccessFilter extends OncePerRequestFilter {

    private final String mode;
    private final List<String> allowCidrs;

    public LanAccessFilter(
            @Value("${smartguard.network.mode:standalone}") String mode,
            @Value("${smartguard.network.lan-allow-cidrs:10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1/32}") String cidrs
    ) {
        this.mode = mode;
        this.allowCidrs = Arrays.stream(cidrs.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!"server".equalsIgnoreCase(mode)) {
            filterChain.doFilter(request, response);
            return;
        }
        String remote = request.getRemoteAddr();
        if (isAllowed(remote)) {
            filterChain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"Acesso permitido apenas na rede local configurada\"}");
    }

    private boolean isAllowed(String ip) {
        try {
            InetAddress address = InetAddress.getByName(ip);
            if (address.isLoopbackAddress() || address.isAnyLocalAddress()) {
                return true;
            }
            byte[] target = address.getAddress();
            for (String cidr : allowCidrs) {
                if (matchCidr(target, cidr)) {
                    return true;
                }
            }
            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    private static boolean matchCidr(byte[] address, String cidr) throws Exception {
        String[] parts = cidr.split("/");
        InetAddress network = InetAddress.getByName(parts[0]);
        int prefix = parts.length > 1 ? Integer.parseInt(parts[1]) : (network.getAddress().length * 8);
        byte[] net = network.getAddress();
        if (net.length != address.length) {
            return false;
        }
        int fullBytes = prefix / 8;
        int remBits = prefix % 8;
        for (int i = 0; i < fullBytes; i++) {
            if (net[i] != address[i]) {
                return false;
            }
        }
        if (remBits == 0) {
            return true;
        }
        int mask = (-1) << (8 - remBits);
        return (net[fullBytes] & mask) == (address[fullBytes] & mask);
    }
}
