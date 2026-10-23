package tn.adasdms.lite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** Point d'entrée de l'API ADAS-DMS Lite. */
@SpringBootApplication
@ConfigurationPropertiesScan
public class AdasDmsLiteApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdasDmsLiteApplication.class, args);
    }
}
