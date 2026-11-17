package com.smartguard.runtime;

import java.nio.file.Path;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.sqlite.SQLiteConfig;
import org.sqlite.SQLiteDataSource;

@Configuration
@Profile("sqlite")
public class SqliteDataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(SqliteDataSourceConfig.class);

    @Bean
    @Primary
    DataSource dataSource(AppPaths appPaths, DatabaseKeyStore keyStore) {
        Path db = appPaths.dbFile();
        String key = keyStore.getOrCreateKey();

        // willena sqlite-jdbc: cipher via query string (todas as conexões, incl. Flyway)
        String url = "jdbc:sqlite:file:" + db.toAbsolutePath().toString().replace('\\', '/')
                + "?cipher=sqlcipher&legacy=4&key=" + key;

        SQLiteConfig config = new SQLiteConfig();
        config.enforceForeignKeys(true);
        config.setJournalMode(SQLiteConfig.JournalMode.WAL);
        config.setBusyTimeout(30_000);

        SQLiteDataSource ds = new SQLiteDataSource(config);
        ds.setUrl(url);

        log.info("SQLite (SQLCipher) em {}", db);
        return ds;
    }
}
