FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY build/libs/*.jar app.jar
COPY github-app-private-key.der /app/config/github-app-private-key.der
ENTRYPOINT ["java", "-jar", "app.jar"]
