--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2025-01-22 02:39:23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 24742)
-- Name: hall; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hall (
    id uuid NOT NULL,
    name character varying NOT NULL,
    capacity numeric NOT NULL
);


ALTER TABLE public.hall OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 24735)
-- Name: reservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation (
    id uuid NOT NULL,
    full_name character varying NOT NULL,
    ticket_count numeric NOT NULL
);


ALTER TABLE public.reservation OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24749)
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    id uuid NOT NULL,
    film_name character varying NOT NULL,
    datetime timestamp with time zone NOT NULL,
    duration time without time zone NOT NULL,
    hall uuid NOT NULL,
    reservation_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- TOC entry 4902 (class 0 OID 24742)
-- Dependencies: 218
-- Data for Name: hall; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hall (id, name, capacity) FROM stdin;
605877f9-5a28-49c8-8861-188cec70e602	1	12
1a9be282-1721-4975-8900-2a89e6942343	2	8
65f7cdf8-e3b1-42fc-9689-a34adfa97324	3	20
a4d7b1e6-a295-4819-a228-682969070de0	4	25
\.


--
-- TOC entry 4901 (class 0 OID 24735)
-- Dependencies: 217
-- Data for Name: reservation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservation (id, full_name, ticket_count) FROM stdin;
4688243b-b8e4-4642-8604-2a8172054b59	2	5
991f5054-130d-4958-80b6-67ccc6de3c83	1	5
\.


--
-- TOC entry 4903 (class 0 OID 24749)
-- Dependencies: 219
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (id, film_name, datetime, duration, hall, reservation_ids) FROM stdin;
c516eaba-f57b-4afc-ad04-df8dd0fc8f5f	Малышка 2	2025-01-25 07:53:00+03	04:53:00	605877f9-5a28-49c8-8861-188cec70e602	{}
ca8fc50e-74e5-4f88-b98f-5912ac16b4b5	Малышка 2	2025-01-21 14:25:00+03	02:25:00	605877f9-5a28-49c8-8861-188cec70e602	{991f5054-130d-4958-80b6-67ccc6de3c83,4688243b-b8e4-4642-8604-2a8172054b59}
9e92f375-473b-443e-9a36-3ea659f65cab	123	2025-01-22 04:06:00+03	05:06:00	605877f9-5a28-49c8-8861-188cec70e602	{}
\.


--
-- TOC entry 4753 (class 2606 OID 24748)
-- Name: hall hall_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hall
    ADD CONSTRAINT hall_pkey PRIMARY KEY (id);


--
-- TOC entry 4751 (class 2606 OID 24741)
-- Name: reservation reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT reservation_pkey PRIMARY KEY (id);


--
-- TOC entry 4755 (class 2606 OID 24756)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


-- Completed on 2025-01-22 02:39:23

--
-- PostgreSQL database dump complete
--

