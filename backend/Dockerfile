# Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn
COPY src src
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

# Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S smartguard && adduser -S smartguard -G smartguard \
  && mkdir -p /app/data/evidence && chown -R smartguard:smartguard /app
COPY --from=build /app/target/*.jar /app/app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh
USER smartguard
ENV SERVER_PORT=8080
ENV EVIDENCE_DIR=/app/data/evidence
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
