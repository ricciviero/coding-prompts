---
id: maven-cheatsheet-it
category: utilities
stack: [java, maven, spring-boot]
language: it
framework: Maven
tooling: [maven, java]
purpose: Sintesi di comandi Maven e Spring Boot da terminale.
version: 1.0.0
last_reviewed: "2025-12-15"
tags: [cheatsheet, productivity]
requires:
  - java>=17
  - maven>=3.9
outputs: [docs]
---

# Cheat sheet Maven + Spring Boot (terminal)

## Ambiente
- Verifica Java: `java -version` / `javac -version`
- Variabile JAVA_HOME (PowerShell): `$env:JAVA_HOME`
- Pulizia cache Maven: `mvn dependency:purge-local-repository`

## Ciclo di build
- Pulizia + compilazione + test: `mvn clean verify`
- Solo build senza test: `mvn clean install -DskipTests`
- Solo test unitari: `mvn test`
- Test di integrazione (se configurati con Failsafe): `mvn verify -DskipUTs -DskipITs=false`
- Packaging jar/boot: `mvn clean package` (crea jar in `target/`)

## Spring Boot
- Avvio locale: `mvn spring-boot:run`
- Avvio con profilo specifico: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`
- Avvio passando variabili: `mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081 --spring.profiles.active=dev"`
- Eseguire jar: `java -jar target/<app>.jar --spring.profiles.active=prod`

## Dipendenze
- Albero dipendenze: `mvn dependency:tree`
- Aggiornare snapshot: `mvn -U clean install`
- Verificare vulnerabilita (se OWASP plugin): `mvn org.owasp:dependency-check-maven:check`

## Qualita e formattazione
- Checkstyle (se configurato): `mvn checkstyle:check`
- Spotless/Formatter (se configurato): `mvn spotless:apply`
- Coverage con JaCoCo: `mvn verify -Pcoverage` oppure `mvn jacoco:report` se presente il profilo

## Database e migrazioni
- Flyway migrate: `mvn -Dflyway.configFiles=src/main/resources/flyway.conf flyway:migrate`
- Liquibase update: `mvn liquibase:update`

## Test mirati
- Singolo test: `mvn -Dtest=UserServiceTest test`
- Singolo metodo: `mvn -Dtest=UserServiceTest#should_create_user test`

## Multi-modulo
- Build di un modulo specifico: `mvn -pl module-name -am clean verify`
- Eseguire solo un modulo Spring Boot: `mvn -pl app-module spring-boot:run`

## Altro utile
- Pulizia target: `mvn clean`
- Mostrare profili attivi: `mvn help:active-profiles`
- Informazioni progetto: `mvn help:effective-pom`
