package org.calpoly.gehackathon.config.data;

import org.apache.commons.dbcp.BasicDataSource;

import javax.sql.DataSource;

public class AbstractLocalDataSourceConfig {

  DataSource createDataSource(String jdbcUrl, String driverClass, String userName, String password) {
    BasicDataSource dataSource = new BasicDataSource();
    dataSource.setUrl(jdbcUrl);
    dataSource.setDriverClassName(driverClass);
    dataSource.setUsername(userName);
    dataSource.setPassword(password);
    return dataSource;
  }
}