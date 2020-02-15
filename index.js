#!/usr/bin/env node

const loopback = require('loopback');
const promisify = require('util').promisify;
const fs = require('fs');
const readline = require("readline2");
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdirp = promisify(require('mkdirp'));
var path = require('path');
// console.log("sdfsdf"+path.resolve(__dirname, process.cwd()+'/server/datasources.json'));
const dataSourceConfig = require(path.resolve(__dirname, process.cwd()+'/server/datasources.json'));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question("Datasource name? ", function(DATASOURCE_NAME) {
  rl.question("Schema? ", function(schema) {
    rl.question("Table name? ", function(table) {

      const db = new loopback.DataSource(dataSourceConfig[DATASOURCE_NAME]);
      // let atable = table_name.split('.');
      // let schema = atable[0].toUpperCase();
      // let table = atable[1].toUpperCase(); 


      discover().then(
        success => process.exit(),
        error => {
          console.error('UNHANDLED ERROR:\n', error);
          process.exit(1);
        },
      );


      async function discover() {
        const options = {
          schema: schema.toUpperCase(),
          relations: true,
          views: true
        };
        const tableSchemas = await db.discoverSchemas(table, options);
        await mkdirp('common/models');
        await writeFile(
          'common/models/'+table.toLowerCase()+'.json',
          JSON.stringify(tableSchemas[schema+'.'+table], null, 2)
        );

        const configJson = await readFile('server/model-config.json', 'utf-8');
        console.log('MODEL CONFIG', configJson);
        const config = JSON.parse(configJson);
        config[table.charAt(0).toUpperCase() + table.slice(1).toLowerCase()] = {
          dataSource: DATASOURCE_NAME,
          public: true
        };
        await writeFile(
          'server/model-config.json',
          JSON.stringify(config, null, 2)
        );
      
      }
    });
  });
});
