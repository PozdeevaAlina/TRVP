import express, {Response, Request} from 'express';
import path, {dirname} from 'path';
import * as http from "node:http";
import pg, {ClientConfig} from 'pg'
import * as fs from "node:fs";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {Client} = pg;

class httpServer {
    public app: express.Application;
    private readonly port: number = 3000;
    private dbClient: pg.Client | undefined = undefined;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use(express.static(path.join(__dirname, '..', 'static')));
        this.app.use(express.static('public', {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                }
            }
        }));

        this.port = 3000;

        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server started on port ${this.port}.\n http://localhost:${this.port}`);
        });
    }

    public async dbConnect(config: ClientConfig) {
        try {
            this.dbClient = new Client(config);
            await this.dbClient.connect();
        } catch (e) {
            console.error(e);
        }
    }

    public async dbExecute(query: string, commit: boolean, values?: string[]): Promise<pg.QueryResult> {
        if (this.dbClient) {
            try {
                await this.dbClient.query('BEGIN');
                const result = this.dbClient.query(query, values);
                if (commit) {
                    await this.dbClient.query('COMMIT');
                }
                return result;
            } catch (e) {
                await this.dbClient.query('ROLLBACK');
            }
        }
        throw new Error('Not connected to DB');
    }
}

try {
    const server = new httpServer();
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pg.json')).toString());
    await server.dbConnect(config);

    server.app.get('/', (_, res) => {
        res.sendFile(path.resolve('static/html/index.html'));
    });

    server.app.get('/hall', async (req, res) => {
        try {
            const {id} = req.query;
            const query = `SELECT id, name as value, capacity FROM public.hall `
                + (id ? `WHERE id = '${id}'` : '')
            const query_result = await server.dbExecute(query, true);
            res.status(200).send(query_result.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.put('/hall', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const query = `INSERT INTO public.hall (id, name, capacity) ` +
                `VALUES ('${body.id}', '${body.name}', '${body.capacity}')`
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.get('/session', async (req, res) => {
        try {
            const {id} = req.query;
            const query = 'SELECT * FROM public.session '
                + (id ? `WHERE id = '${id}' ` : '');
            const query_result = await server.dbExecute(query, true);
            res.status(200).send(query_result.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.post('/session', async (req, res) => {
        try {
            const {id, reservation_id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            let query: string;
            if (reservation_id) {
                const reservation = body.reservation;
                if (reservation.remove) {
                    query = `DELETE FROM public.reservation WHERE id = '${reservation_id}'`;
                    await server.dbExecute(query, false);
                } else {
                    query = `INSERT INTO public.reservation (id, full_name, ticket_count) ` +
                        `VALUES ('${reservation.id}', '${reservation.full_name}', '${reservation.ticket_count}') `;
                    await server.dbExecute(query, false);
                }
            }
            const set = [(body.film_name ? `film_name = '${body.film_name}'` : ''),
                (body.datetime ? `datetime = '${body.datetime}'` : ''),
                (body.duration ? `duration = '${body.duration}'` : ''),
                (body.hall ? `hall = '${body.hall}'` : ''),
                (body.reservation_id
                    ? (body.remove
                        ? `reservation_ids = array_remove(reservation_ids, '${body.reservation_id}')`
                        : `reservation_ids = array_append(reservation_ids, '${body.reservation_id}')`)
                    : '')]
            query = `UPDATE public.session `
                + `SET `
                + set.filter(value => value.length > 0).join(', ') + ' '
                + `WHERE id = '${id}' `
                + (body.reservation_id
                    ? (body.remove
                        ? `AND '${body.reservation_id}' = ANY(reservation_ids)`
                        : `AND '${body.reservation_id}' != ALL(reservation_ids)`)
                    : '');
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.put('/session', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const query = `INSERT INTO public.session (id, film_name, datetime, duration, hall) ` +
                `VALUES ('${body.id}', '${body.film_name}', '${body.datetime}', '${body.duration}', '${body.hall}')`
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.delete('/session', async (req, res) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            let query = `SELECT reservation_ids FROM public.session WHERE id = '${id}'`;
            const reservation_ids: string[] = (await server.dbExecute(query, true)).rows[0].reservation_ids;
            if (reservation_ids.length > 0) {
                query = `DELETE FROM public.reservation ` +
                    `WHERE id IN (${reservation_ids.map(reservation_id => `'${reservation_id}'`).join(', ')})`;
                await server.dbExecute(query, false);
            }
            query = `DELETE FROM public.session ` +
                `WHERE id = '${id}'`
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.get('/reservation', async (req, res) => {
        try {
            const {id} = req.query;
            const query = `SELECT * FROM public.reservation `
                + (id ? `WHERE id = '${id}' ` : '');
            const query_result = await server.dbExecute(query, true);
            res.status(200).send(query_result.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.post('/reservation', async (req: Request, res: Response) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const set = [(body.full_name
                ? `full_name = '${body.full_name}'`
                : '')
                , (body.ticket_count
                    ? `ticket_count = '${body.ticket_count}'`
                    : '')];
            const query = 'UPDATE public.reservation '
                + 'SET '
                + set.filter(value => value.length > 0).join(', ') + ' '
                + `WHERE id = '${id}'`
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.put('/reservation', async (req: Request, res: Response) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const query = `INSERT INTO public.reservation (id, full_name, ticket_count) `
                + `VALUES ('${body.id}', '${body.full_name}', '${body.ticket_count}') `;
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.delete('/reservation', async (req, res) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const query = `DELETE FROM public.reservation WHERE id = '${id}'`;
            await server.dbExecute(query, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

} catch (e) {
    console.error(e);
}
