interface info {
    name: string;
    values?: string | string[];
    class: string;
}

interface input {
    id?: string;
    class: string[];
    label: string;
    label_name: string;
    type: string;
    value?: string;
    max?: string;
    min?: string;
}

interface select_row {
    id: string;
    value: string;
}

interface select {
    id?: string;
    class: string[];
    label: string;
    label_name: string;
    option?: string;
    multiple?: boolean;
    fetch_options?: fetch_options;
    values?: string | string[];
}

interface fetch_options {
    destination: string;
    method: string;
    body?: object;
    params?: Record<string, any>;
}

interface reservation {
    id: string;
    full_name: string;
    ticket_count: string;
}

interface session {
    id: string;
    film_name: string;
    datetime: string;
    duration: string;
    hall: string;
    reservation_ids: string[];
}

function modal_toggle() {
    const modal = document.querySelector('.modal')!;
    if (modal.classList.toggle('hidden')) {
        const content = modal.querySelector('.content');
        content!.innerHTML = '';

        const approveBtn = modal.querySelector('#approve');
        approveBtn!.remove();
    }
}

async function api_fetch(url: string, method: string, body?: object, query?: Record<string, any>) {
    const req = await fetch(url + (query ? `?${new URLSearchParams(query).toString()}` : ''), {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!req.ok) {
        throw new Error(await req.text());
    }
    return req;
}

function empty_string(str: string | undefined) {
    return str && str.length > 0;
}

function add_info(el: Element, conf: info) {
    el.classList.add(conf.class);

    let p = el.appendChild(document.createElement('p'));
    p.innerText = conf.name;
    p.classList.add('title');

    p = el.appendChild(document.createElement('p'));
    if (typeof conf.values === 'string') {
        p.innerText = conf.values;
    } else if (Array.isArray(conf.values)) {
        for (const value of conf.values) {
            p.innerHTML += value + '<br>'
        }
    }

    return p;
}

function add_input(el: Element, conf: input) {
    const container = document.createElement('div');
    container.classList.add(...conf.class);

    const label = document.createElement('label');
    label.htmlFor = conf.label + conf.id;
    label.innerText = conf.label_name;

    const input = document.createElement('input');
    input.type = conf.type;
    input.id = conf.label + (conf.id ? conf.id : '');
    input.value = conf.value ? conf.value : '';
    input.max = conf.max ? conf.max : '';
    input.min = conf.min ? conf.min : '';

    container.appendChild(label);
    container.appendChild(input);
    el.appendChild(container);

    return input;
}

function add_select(el: Element, conf: select) {
    const container = document.createElement('div');
    container.classList.add(...conf.class);

    const label = document.createElement('label');
    label.htmlFor = conf.label + conf.id;
    label.innerText = conf.label_name;

    const select = document.createElement('select');
    select.id = conf.label + (conf.id ? conf.id : '');
    if (conf.multiple) {
        select.multiple = conf.multiple
    }

    if (conf.option) {
        const mainOption = document.createElement('option');
        mainOption.innerText = conf.option;
        mainOption.disabled = true;
        select.appendChild(mainOption);
    }

    container.appendChild(label);
    container.appendChild(select);
    el.appendChild(container);

    return select;
}

async function add_select_sql(el: Element, conf: select) {
    const select = add_select(el, conf);

    const res = await api_fetch(conf.fetch_options!.destination, conf.fetch_options!.method, conf.fetch_options!.body, conf.fetch_options!.params);

    const select_rows: select_row[] = await res.json();
    for (const row of select_rows) {
        const option = document.createElement('option');
        option.innerText = row.value;
        option.value = row.id;
        select.appendChild(option);
        if (typeof conf.values === 'string') {
            if (row.id === conf.values) {
                select.value = row.id;
            }
        } else if (Array.isArray(conf.values)) {
            if (conf.values!.includes(row.id)) {
                option.selected = true;
            }
        }
    }

    return select;
}

async function add_reservations(session: Element, reservations_cont: Element, reservation_ids: string[] | undefined) {
    if (reservation_ids && reservation_ids.length > 0) {
        let resp: Response | any;
        let row: reservation[];
        for (const reservation_id of reservation_ids) {
            resp = await api_fetch('reservation', 'GET', undefined, {id: reservation_id})
            row = await resp.json();

            add_reservation(session, reservations_cont, row[0]);
        }
    }
}

function validate_count(session: Element, ticket_count: number) {
    return +session.getAttribute('capacity')! >= +session.getAttribute('now-capacity')! + ticket_count;
}

function add_reservation(session: Element, reservations_cont: Element, conf?: reservation) {
    const reservation = document.createElement('div');
    reservation.classList.add('reservation-item');
    reservation.setAttribute('edited', 'false');
    if (!conf) {
        reservation.classList.add('editable');
    } else {
        reservation.id = conf.id;
    }

    const id = conf ? conf.id : crypto.randomUUID();
    const reservation_id = reservation.appendChild(document.createElement('div'));
    reservation_id.classList.add('reservation-id');
    reservation_id.innerHTML = `<p class="title">ID: ${id}</p>`;

    const reservation_full_name = reservation.appendChild(document.createElement('div'));
    reservation_full_name.classList.add('reservation-full-name');
    reservation_full_name.innerHTML = '<p class="title">ФИО:</p>';

    const full_name_input = add_input(reservation_full_name, {
        id: id,
        class: ['inputs'],
        label: 'full_name',
        label_name: '',
        type: 'text'
    });
    full_name_input.addEventListener('change', () => {
        reservation.setAttribute('edited', 'true');
    });

    const full_name_p = reservation_full_name.appendChild(document.createElement('p'));
    if (conf && conf.full_name) {
        full_name_p.innerText = conf.full_name;
        full_name_input.value = conf.full_name;
    }
    full_name_p.setAttribute('value', full_name_input.value);

    const reservation_ticket_count = reservation.appendChild(document.createElement('div'));
    reservation_ticket_count.classList.add('reservation-ticket-count');
    reservation_ticket_count.innerHTML = '<p class="title">Количество билетов:</p>';

    const ticket_count_input = add_input(reservation_ticket_count, {
        id: id,
        class: ['inputs'],
        label: 'ticket_count',
        label_name: '',
        type: 'number',
        min: '0',
        max: '5'
    });
    ticket_count_input.addEventListener('change', () => {
        reservation.setAttribute('edited', 'true');
    });

    const ticket_count_p = reservation_ticket_count.appendChild(document.createElement('p'));
    if (conf && conf.ticket_count) {
        ticket_count_p.innerText = conf.ticket_count;
        ticket_count_input.value = conf.ticket_count;
    }
    ticket_count_p.setAttribute('value', ticket_count_input.value);

    const reservation_buttons = reservation.appendChild(document.createElement('div'));
    reservation_buttons.classList.add('reservation-buttons');

    const edit = reservation_buttons.appendChild(document.createElement('img')) as HTMLImageElement;
    edit.src = "../assets/edit.svg";
    edit.alt = "Edit";
    edit.addEventListener('click', () => {
        full_name_input.value = full_name_p.getAttribute('value')!;
        ticket_count_input.value = ticket_count_p.getAttribute('value')!;

        reservation.classList.add('editable');

        edit.classList.toggle('hidden');
        del.classList.toggle('hidden');
        approve.classList.toggle('hidden');
        cancel.classList.toggle('hidden');
    });

    const del = reservation_buttons.appendChild(document.createElement('img'));
    del.src = "../assets/delete-button.svg";
    del.alt = "Delete";
    del.addEventListener('click', async () => {
        const session = reservation.parentElement!.parentElement!.parentElement!;
        await api_fetch('session', 'POST', {
            reservation_id: id,
            remove: true,
            reservation: {
                remove: true
            }
        }, {
            id: session.id,
            reservation_id: id
        });

        session.setAttribute('now-capacity', (+session.getAttribute('now-capacity')! - +ticket_count_input.value).toString());
        (session.querySelector('.now-capacity')! as HTMLElement).innerText = session.getAttribute('now-capacity')!;

        reservation.remove();
    });

    const approve = reservation_buttons.appendChild(document.createElement('img'));
    approve.src = "../assets/confirm.svg";
    approve.alt = "Approve";
    approve.addEventListener('click', async () => {
        const session = reservation.parentElement!.parentElement!.parentElement!;

        if (full_name_input.value === full_name_p.getAttribute('value') && ticket_count_input.value === ticket_count_p.getAttribute('value')) {
            reservation.setAttribute('edited', 'false');
        }

        if (reservation.getAttribute('edited') === 'true') {
            if (!empty_string(full_name_input.value)) {
                alert('Поле ФИО должно быть заполнено');
                return;
            }
            if (!empty_string(ticket_count_input.value)) {
                alert('Поле "Количество билетов" должно быть заполнено');
                return;
            }

            const reservation_items = session.querySelectorAll('.reservation-item');

            const func = async (filtered_items: Element[]) => {
                if (filtered_items.length > 0) {
                    filtered_items = filtered_items.filter(item =>
                        item.querySelector('.reservation-full-name p:not(.title)')!.getAttribute('value')! === full_name_input.value);
                    if (filtered_items.length > 0) {
                        const ticket_count = +filtered_items[0].querySelector('.reservation-ticket-count p:not(.title)')!.getAttribute('value')!;
                        const new_ticket_count = ticket_count + +ticket_count_input.value;
                        if (new_ticket_count > 5) {
                            alert('Слишком много билетов на данную персону');
                            return;
                        } else {
                            await api_fetch('reservation', 'POST', {
                                ticket_count: ticket_count + +ticket_count_input.value
                            }, {
                                id: filtered_items[0].id,
                            });
                            const p = filtered_items[0].querySelector('.reservation-ticket-count p:not(.title)')!;
                            p.textContent = new_ticket_count.toString();
                            p.setAttribute('value', new_ticket_count.toString());
                            session.setAttribute('now-capacity', (+session.getAttribute('now-capacity')! +
                                +ticket_count_input.value).toString());
                            (filtered_items[0].querySelector('.reservation-ticket-count input')! as HTMLInputElement).value = new_ticket_count.toString();
                        }
                        return true;
                    }
                    return false;
                }
            }

            if (reservation.id) {
                if (!validate_count(session, +ticket_count_input.value - +ticket_count_p.getAttribute('value')!)) {
                    alert('Превышена вместимость зала');
                    return;
                }

                let filtered_items = Array.from(reservation_items).filter(reservation_item => reservation_item.id != reservation.id
                    && reservation_item.id);

                if (await func(filtered_items)) {
                    await api_fetch('session', 'POST', {
                        reservation_id: reservation.id,
                        remove: true,
                        reservation: {
                            remove: true
                        }
                    }, {
                        id: session.id,
                        reservation_id: reservation.id,
                    });
                    reservation.remove();
                } else {
                    await api_fetch('reservation', 'POST', {
                        full_name: full_name_input.value,
                        ticket_count: ticket_count_input.value
                    }, {
                        id: id,
                    });
                    session.setAttribute('now-capacity', (+session.getAttribute('now-capacity')! +
                        +ticket_count_input.value -
                        +ticket_count_p.getAttribute('value')!).toString());

                    full_name_p.innerText = full_name_input.value;
                    ticket_count_p.innerText = ticket_count_input.value;

                    full_name_p.setAttribute('value', full_name_input.value);
                    ticket_count_p.setAttribute('value', ticket_count_input.value);
                }
            } else {
                if (!validate_count(session, +ticket_count_input.value)) {
                    alert('Превышена вместимость зала');
                    return;
                }
                let filtered_items = Array.from(reservation_items).filter(reservation_item => reservation_item.id);

                if (await func(filtered_items)) {
                    reservation.remove();
                } else {
                    await api_fetch('session', 'POST', {
                        reservation_id: id,
                        reservation: {
                            id: id,
                            full_name: full_name_input.value,
                            ticket_count: ticket_count_input.value
                        }
                    }, {
                        id: session.id,
                        reservation_id: id
                    });

                    session.setAttribute('now-capacity', (+session.getAttribute('now-capacity')! + +ticket_count_input.value).toString());

                    full_name_p.innerText = full_name_input.value;
                    ticket_count_p.innerText = ticket_count_input.value;

                    full_name_p.setAttribute('value', full_name_input.value);
                    ticket_count_p.setAttribute('value', ticket_count_input.value);
                }
            }

            reservation.id = id;
            enable_drag_drop_reservation(reservation);
        }

        reservation.classList.remove('editable');
        reservation.setAttribute('edited', 'false');

        (session.querySelector('.now-capacity')! as HTMLElement).innerText = session.getAttribute('now-capacity')!;

        edit.classList.toggle('hidden');
        del.classList.toggle('hidden');
        approve.classList.toggle('hidden');
        cancel.classList.toggle('hidden');
    });

    const cancel = reservation_buttons.appendChild(document.createElement('img')) as HTMLImageElement;
    cancel.src = "../assets/delete.svg";
    cancel.alt = "Cancel";
    cancel.addEventListener('click', () => {
        if (reservation.id) {
            reservation.classList.remove('editable');

            full_name_input.value = full_name_p.getAttribute('value')!;
            ticket_count_input.value = ticket_count_p.getAttribute('value')!;

            edit.classList.toggle('hidden');
            del.classList.toggle('hidden');
            approve.classList.toggle('hidden');
            cancel.classList.toggle('hidden');
        } else {
            reservation.remove();
        }
    });

    if (conf) {
        approve.classList.add('hidden');
        cancel.classList.add('hidden');
        session.setAttribute('now-capacity', (+session.getAttribute('now-capacity')! + +ticket_count_input.value).toString());
    } else {
        edit.classList.add('hidden');
        del.classList.add('hidden');
    }

    reservations_cont.appendChild(reservation);
}

async function create_session(conf: session) {
    const sessions_list = document.querySelector('.reservations-list');

    const session = document.createElement('li');
    session.classList.add('session');
    session.id = conf.id
    session.setAttribute('capacity', '0');
    session.setAttribute('now-capacity', '0');

    const id = document.createElement('div');
    id.innerText = `ID: ${conf.id}`;
    session.appendChild(id);

    const main_info = document.createElement('div');
    main_info.classList.add('main-info');

    let p = main_info.appendChild(document.createElement('p'));
    p.innerText = 'Основная информация';

    const main_buttons = document.createElement('div');
    main_buttons.classList.add('buttons');

    const edit = main_buttons.appendChild(document.createElement('img'));
    edit.src = '../assets/edit.svg';
    edit.alt = 'edit';
    edit.addEventListener('click', () => {
        info.classList.toggle('editable');

        edit.classList.toggle('hidden');
        approve.classList.toggle('hidden');
        cancel.classList.toggle('hidden');
    });

    const approve = main_buttons.appendChild(document.createElement('img'));
    approve.src = '../assets/confirm.svg';
    approve.alt = 'edit';
    approve.classList.add('hidden');
    approve.addEventListener('click', async () => {
        if (info.getAttribute('edited') === 'true') {
            if (film_name_input.value === '') {
                alert('Имя фильма должно быть заполнено');
                return;
            } else if (datetime_input.value === '') {
                alert('Дата должна быть заполнена');
                return;
            } else if (duration_input.value === '') {
                alert('Длительность должна быть заполнена');
                return;
            } else if (hall_select.value === '') {
                alert('Зал должен быть заполнен');
                return;
            }

            const hall_capacity = (await (await api_fetch('hall', 'GET', undefined, {id: hall_select.value})).json())[0].capacity;
            if (+session.getAttribute('now-capacity')! > +hall_capacity) {
                alert('Занятость сеанса слишком большая для данного зала');
                return;
            }

            const duration_arr: number[] = duration_input.value.split(':').map(val => +val);
            if (!approve_datetime(datetime_input.value, duration_arr[0], duration_arr[1], hall_select.value)) {
                alert('Между сеансами должна быть техническая пауза в течение 15 минут');
                return;
            }

            await api_fetch('session', 'POST', {
                film_name: film_name_input.value,
                datetime: datetime_input.value,
                duration: duration_input.value,
                hall: hall_select.value,
            }, {
                id: conf.id
            });

            film_name_p.innerText = film_name_input.value;
            datetime_p.innerText = datetime_input.value;
            duration_p.innerText = duration_input.value;
            hall_p.innerText = hall_select.selectedOptions[0].innerText;

            film_name_p.setAttribute('value', film_name_input.value);
            datetime_p.setAttribute('value', datetime_input.value);
            duration_p.setAttribute('value', duration_input.value);
            hall_p.setAttribute('value', hall_select.value);

            session.setAttribute('capacity', hall_capacity);
            capacity_p.innerText = session.getAttribute('capacity')!;
            now_capacity_p.innerText = session.getAttribute('now-capacity')!;
        }

        info.setAttribute('edited', 'false');
        info.classList.toggle('editable');

        edit.classList.toggle('hidden');
        approve.classList.toggle('hidden');
        cancel.classList.toggle('hidden');
    })

    const cancel = main_buttons.appendChild(document.createElement('img'));
    cancel.src = '../assets/delete.svg';
    cancel.alt = 'edit';
    cancel.classList.add('hidden');
    cancel.addEventListener('click', () => {
        info.classList.toggle('editable');

        if (info.getAttribute('edited') === 'true') {
            film_name_p.innerText = film_name_input.value;
            datetime_p.innerText = datetime_input.value;
            duration_p.innerText = duration_input.value;
            hall_p.innerText = hall_select.selectedOptions[0].innerText;

            film_name_input.value = film_name_p.getAttribute('value')!;
            datetime_input.value = datetime_p.getAttribute('value')!;
            duration_input.value = duration_p.getAttribute('value')!;
            hall_select.value = hall_p.getAttribute('value')!;
        }

        edit.classList.toggle('hidden');
        approve.classList.toggle('hidden');
        cancel.classList.toggle('hidden');
    });
    main_info.appendChild(main_buttons);

    session.appendChild(main_info);

    const info = document.createElement('div');
    info.classList.add('info');
    info.setAttribute('edited', 'false');

    const film_name = document.createElement('div');
    const film_name_p = add_info(film_name, {
        name: 'Название фильма',
        values: conf.film_name,
        class: 'session-film-name'
    });
    const film_name_input = add_input(film_name, {
        id: conf.id,
        class: ['inputs'],
        label: 'film_name',
        label_name: '',
        type: 'text',
        value: conf.film_name,
    });
    film_name_p.setAttribute('value', film_name_input.value);
    film_name_input.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    })
    info.appendChild(film_name);

    const datetime = document.createElement('div');
    const datetime_p = add_info(datetime, {
        name: 'Дата',
        values: conf.datetime.slice(0, 16).replace('T', ' '),
        class: 'session-datetime'
    });
    const now_date = new Date();
    const datetime_input = add_input(datetime, {
        id: conf.id,
        class: ['inputs', 'datetime'],
        label: 'datetime',
        label_name: '',
        type: 'datetime-local',
        value: conf.datetime.slice(0, 16),
        min: (new Date(now_date.getTime() + 24 * 60 * 60 * 1000)).toISOString().slice(0, 10) + 'T00:00'
    });
    datetime_p.setAttribute('value', datetime_input.value);
    datetime_input.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    })
    info.appendChild(datetime);

    const duration = document.createElement('div');
    const duration_p = add_info(duration, {
        name: 'Длительность',
        values: conf.duration,
        class: 'session-duration'
    });
    const duration_input = add_input(duration, {
        id: conf.id,
        class: ['inputs', 'duration'],
        label: 'duration',
        label_name: '',
        type: 'time',
        value: conf.duration
    });
    duration_p.setAttribute('value', duration_input.value);
    duration_input.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    })
    info.appendChild(duration);

    const hall = document.createElement('div');
    const hall_p = add_info(hall, {
        name: 'Зал',
        values: '',
        class: 'session-hall'
    });
    const hall_select = await add_select_sql(hall, {
        id: conf.id,
        class: ['inputs'],
        label: 'hall',
        label_name: '',
        values: conf.hall,
        fetch_options: {
            destination: 'hall',
            method: 'GET'
        }
    });
    hall_p.innerText = hall_select.selectedOptions[0].innerText;
    hall_p.setAttribute('value', hall_select.value);
    hall_select.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    });
    info.appendChild(hall);

    const capacity = document.createElement('div');

    p = capacity.appendChild(document.createElement('p'));
    p.classList.add('title');
    p.innerText = 'Вместимость зала';

    const capacity_p = capacity.appendChild(document.createElement('p'));

    info.appendChild(capacity);

    const now_capacity = document.createElement('div');

    p = now_capacity.appendChild(document.createElement('p'));
    p.classList.add('title');
    p.innerText = 'Текущая заполненность зала';

    const now_capacity_p = now_capacity.appendChild(document.createElement('p'));
    now_capacity_p.classList.add('now-capacity');

    info.appendChild(now_capacity);

    session.appendChild(info);

    const reservations_list = session.appendChild(document.createElement('div'));
    reservations_list.classList.add('reservations-list');

    const reservations_list_p = reservations_list.appendChild(document.createElement('p'));
    reservations_list_p.innerHTML = 'Список броней билетов:';

    const reservations_cont = reservations_list.appendChild(document.createElement('div'));
    reservations_cont.classList.add('reservations-cont');

    const add = session.appendChild(document.createElement('button'));
    add.classList.add('add-session-btn');
    add.innerText = 'Добавить бронь';
    add.addEventListener('click', () => {
        add_reservation(session, reservations_cont);
    });

    const del = session.appendChild(document.createElement('button'));
    del.classList.add('delete-session-btn');
    del.innerText = 'Удалить сеанс';
    del.addEventListener('click', async () => {
        await api_fetch('session', 'DELETE', undefined, {id: session.id});

        session.remove();
    });

    await add_reservations(session, reservations_cont, conf.reservation_ids);

    const hall_capacity = (await (await api_fetch('hall', 'GET', undefined, {id: hall_select.value})).json())[0].capacity;
    session.setAttribute('capacity', hall_capacity);
    capacity_p.innerText = session.getAttribute('capacity')!;
    now_capacity_p.innerText = session.getAttribute('now-capacity')!;

    sessions_list!.insertBefore(session, sessions_list!.lastElementChild);

    return session;
}

function approve_datetime(datetime_str: string, hours: number, minutes: number, hall: string) {
    const sessions = document.querySelectorAll('.session');
    const datetime = new Date(datetime_str);
    let start_datetime: Date;
    let end_datetime: Date;
    const res: boolean[] = [];
    Array.from(sessions).filter(session => session.querySelector('.session-hall p:not(.title)')!.getAttribute('value')! === hall)
        .forEach(session => {
            start_datetime = new Date((new Date((session.querySelector('.datetime input')! as HTMLInputElement).value)).getTime()
                - 15 * 60 * 1000 - hours * 60 * 60 * 1000 - minutes * 60 * 1000);
            const duration: number[] = (session.querySelector('.duration input')! as HTMLInputElement).value.split(':').map(value => +value);
            end_datetime = new Date(start_datetime.getTime() +
                duration[0] * 60 * 60 * 1000 +
                duration[1] * 60 * 1000 +
                hours * 60 * 60 * 1000 +
                minutes * 60 * 1000 +
                30 * 60 * 1000);
            res.push(start_datetime.getTime() <= datetime.getTime() && end_datetime.getTime() >= datetime.getTime());
        });
    return !res.some(value => value);
}

async function add_session() {
    const modal = document.querySelector('.modal');
    if (modal) {
        const content = modal.querySelector('.content');

        const film_name = add_input(content!, {
            class: ['title'],
            label: 'film_name',
            label_name: 'Название фильма',
            type: 'text'
        });

        const now_date = new Date();
        const datetime = add_input(content!, {
            class: ['title'],
            label: 'datetime',
            label_name: 'Дата и время сеанса',
            type: 'datetime-local',
            min: (new Date(now_date.getTime() + 24 * 60 * 60 * 1000)).toISOString().slice(0, 10) + 'T00:00'
        });

        const duration = add_input(content!, {
            class: ['title'],
            label: 'duration',
            label_name: 'Длительность сеанса',
            type: 'time',
            min: (new Date(now_date.getTime() + 24 * 60 * 60 * 1000)).toISOString().slice(0, 10) + 'T00:00'
        });

        const hall = await add_select_sql(content!, {
            class: ['title'],
            label: 'hall',
            label_name: 'Зал',
            fetch_options: {
                destination: 'hall',
                method: 'GET'
            }
        });

        async function create_new_session() {
            const uuid = crypto.randomUUID();

            if (film_name.value === '') {
                alert('Имя фильма должно быть заполнено');
                return;
            } else if (datetime.value === '') {
                alert('Дата должна быть заполнена');
                return;
            } else if (duration.value === '') {
                alert('Длительность должна быть заполнена');
                return;
            } else if (hall.value === '') {
                alert('Зал должен быть заполнен');
                return;
            }

            const duration_arr: number[] = duration.value.split(':').map(val => +val);
            if (!approve_datetime(datetime.value, duration_arr[0], duration_arr[1], hall.value)) {
                alert('Между сеансами должна быть техническая пауза в течение 15 минут');
                return;
            }

            await api_fetch('/session', 'PUT', {
                id: uuid,
                film_name: film_name.value,
                datetime: datetime.value,
                duration: duration.value,
                hall: hall.value,
            });

            const session = await create_session({
                id: uuid,
                film_name: film_name.value,
                datetime: datetime.value,
                duration: duration.value,
                hall: hall.value,
                reservation_ids: []
            })

            enable_drag_drop_session(session)
            return true;
        }

        const modal_buttons = modal.querySelector('.modal-buttons');

        const approve = document.createElement('img');
        approve.src = '../assets/confirm.svg';
        approve.alt = 'Approve';
        approve.id = 'approve';
        approve.addEventListener('click', async () => {
            try {
                if (await create_new_session())
                    modal_toggle();
            } catch (e: any) {
                window.alert(e.message);
            }
        });
        modal_buttons!.insertBefore(approve, modal_buttons!.firstChild);

        modal_toggle();
    }
}

function enable_drag_drop_session(session: HTMLElement) {
    session.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        session.classList.add('drag-over');
    });

    session.addEventListener('dragleave', () => {
        session.classList.remove('drag-over');
    });

    session.addEventListener('drop', async (e: DragEvent) => {
        e.preventDefault();
        session.classList.remove('drag-over');

        const data = e.dataTransfer?.getData('text/plain');
        if (!data) return;

        const {reservation_id} = JSON.parse(data);
        const item = document.getElementById(reservation_id)!;
        const dragged_reservation = document.getElementById(reservation_id)!;
        const target_reservation_cont = session.querySelector<HTMLElement>('.reservations-cont')!;

        const session_id = session.id;

        const source_session = dragged_reservation.closest('.session')!;

        if (session.querySelector('.session-film-name p:not(.title)')!.textContent !==
            source_session.querySelector('.session-film-name p:not(.title)')!.textContent) {
            alert('Фильм не совпадает')
            return;
        }

        if (!session_id) return;

        const ticket_count = +(item.querySelector('.reservation-ticket-count input') as HTMLInputElement).value;
        if (!validate_count(session, ticket_count)) {
            alert('Превышена вместимость зала');
            return;
        }

        if (!target_reservation_cont.querySelector('.reservation-item')) {
            const placeholder = document.createElement('div');
            placeholder.classList.add('reservation-item-placeholder');
            target_reservation_cont.appendChild(placeholder);
        }

        const source_session_id = source_session?.id;
        if (source_session_id) {
            await api_fetch('/session', 'POST', {
                reservation_id,
                remove: true
            }, {
                id: source_session_id
            });
        }

        await api_fetch('/session', 'POST', {
            reservation_id,
        }, {
            id: session_id
        });

        target_reservation_cont.appendChild(dragged_reservation);

        const placeholder = target_reservation_cont.querySelector('.reservation-item-placeholder');
        if (placeholder) placeholder.remove();

        source_session!.setAttribute('now-capacity', (+source_session!.getAttribute('now-capacity')! - ticket_count).toString());
        session!.setAttribute('now-capacity', (+session!.getAttribute('now-capacity')! + ticket_count).toString());
        (session.querySelector('.now-capacity')! as HTMLElement).innerText = session.getAttribute('now-capacity')!;
        (source_session!.querySelector('.now-capacity')! as HTMLElement).innerText = source_session!.getAttribute('now-capacity')!;
    });
}

function enable_drag_drop_reservation(item: HTMLElement) {
    item.draggable = true;
    item.addEventListener('dragstart', (e: DragEvent) => {
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                reservation_id: item.id
            }));
        }
        item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
    });
}

function enable_drag_drop() {
    const reservations = document.querySelectorAll<HTMLElement>('.reservation-item');
    reservations.forEach(enable_drag_drop_reservation);

    const sessions = document.querySelectorAll<HTMLElement>('.session');
    sessions.forEach(enable_drag_drop_session);
}

async function init() {
    const result = await api_fetch('session', 'GET');
    const rows: session[] = await result.json();
    for (const row of rows) {
        await create_session(row);
    }

    enable_drag_drop();
}
