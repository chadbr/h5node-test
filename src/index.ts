import { hdf5, h5lt, h5tb } from 'hdf5';
import { Access } from 'hdf5/lib/globals';
import * as fs from 'fs';
import * as path from 'path';

export class App {

  file: hdf5.File;
  public async processRequest(): Promise<void> {

    this.file = new hdf5.File('./dist/4d.h5', Access.ACC_RDONLY);
    try {
      console.log(process.cwd());
      const h5path = '/test';

      const dims = this.getDimensions(h5path, 'Fill');
      console.log(dims);

      const group = this.file.openGroup(h5path);
      const dataset = h5lt.readDataset(group.id, 'Fill');
      console.log(dataset);

      const datasetAsTyped = dataset as Float32Array;

      for (let iteration = 0; iteration < dims.iterations; iteration++) {
        for (let step = 0; step < dims.steps; step++) {

          // get sheet of data
          const start = (iteration * dims.steps * dims.rows * dims.columns) +
                          (step * dims.rows * dims.columns);
          const end = start + (dims.rows * dims.columns);

          const subset = datasetAsTyped.subarray(start, end);

          let rendered: string = '';
          // show rows with data
          for (let row = 0; row < dims.rows; row++) {
            const rowData = subset.subarray(row * dims.columns, (row * dims.columns) + dims.columns);
            rendered += `${rowData.toString()}\n`;
          }

          const outfile = path.join(__dirname, iteration.toString() + `-` + step.toFixed() + `.csv`);
          fs.writeFileSync(outfile, rendered);

        }
      }

      console.log('made it');

    } catch (error) {
      console.log(error);
    } finally {
      this.file.close();
    }
  }

  private hasNumbers(rowData: Float32Array): boolean {
    const answer = rowData.findIndex((num, i, a) => Number.isNaN(num) ? false : true);
    return answer > -1;
  }

  private getDimensions(path: string, property: string): { iterations: number, steps: number, columns: number, rows: number } {
    const group = this.file.openGroup(path);
    const dims = group.getDatasetDimensions(property);
    console.log(`${property} ${dims}`);
    const [iterations, steps, rows, columns] = dims;
    return { iterations: iterations, steps: steps, columns: columns, rows: rows };
  }
}

const app: App = new App();
/* tslint:disable:no-floating-promises */
app.processRequest()
  .then(() => process.exit(0))
  .catch((Error) => {
    console.log(`error: ${Error}`);
    process.exit(0);
  });
