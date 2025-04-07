--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-03-24 19:12:06

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
-- TOC entry 219 (class 1259 OID 27480)
-- Name: actors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actors (
    actorid integer NOT NULL,
    name character varying(255),
    bio text,
    birthdate date,
    deathdate date,
    pictureurl character varying(255)
);


ALTER TABLE public.actors OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 27473)
-- Name: directors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.directors (
    directorid integer NOT NULL,
    name character varying(255),
    bio text,
    birthyear date,
    deathyear date
);


ALTER TABLE public.directors OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 27466)
-- Name: genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genres (
    genreid integer NOT NULL,
    name character varying(255),
    description text
);


ALTER TABLE public.genres OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 27526)
-- Name: moviecast; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moviecast (
    castid integer NOT NULL,
    movieid integer,
    actorid integer
);


ALTER TABLE public.moviecast OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 27487)
-- Name: movies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movies (
    movieid integer NOT NULL,
    title character varying(255),
    description text,
    directorid integer,
    genreid integer,
    imageurl character varying(255),
    featured boolean,
    releaseyear integer,
    rating double precision
);


ALTER TABLE public.movies OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 27504)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    userid integer NOT NULL,
    username character varying(255),
    email character varying(255),
    firstname character varying(255),
    lastname character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 27511)
-- Name: usersmovies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usersmovies (
    usermovieid integer NOT NULL,
    userid integer,
    movieid integer
);


ALTER TABLE public.usersmovies OWNER TO postgres;

--
-- TOC entry 4885 (class 0 OID 27480)
-- Dependencies: 219
-- Data for Name: actors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000001, 'Tom Hardy', 'English actor known for his roles in Inception and Mad Max: Fury Road', '1977-09-15', NULL, 'tom_hardy.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000002, 'Charlize Theron', 'South African-American actress known for her roles in Mad Max: Fury Road and Monster', '1975-08-07', NULL, 'charlize_theron.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000003, 'Bruce Willis', 'American actor known for his role in Die Hard', '1955-03-19', NULL, 'bruce_willis.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000004, 'Alan Rickman', 'English actor known for his roles in Die Hard and Harry Potter', '1946-02-21', '2016-01-14', 'alan_rickman.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000005, 'Keanu Reeves', 'Canadian actor known for his roles in John Wick and The Matrix', '1964-09-02', NULL, 'keanu_reeves.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000006, 'Willem Dafoe', 'American actor known for his roles in Platoon and John Wick', '1955-07-22', NULL, 'willem_dafoe.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000007, 'Mel Gibson', 'American actor and filmmaker known for his roles in Lethal Weapon and Braveheart', '1956-01-03', NULL, 'mel_gibson.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000008, 'Danny Glover', 'American actor known for his roles in Lethal Weapon and The Color Purple', '1946-07-22', NULL, 'danny_glover.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000009, 'Arnold Schwarzenegger', 'Austrian-American actor known for his roles in Terminator and Predator', '1947-07-30', NULL, 'arnold_schwarzenegger.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000010, 'Linda Hamilton', 'American actress known for her roles in Terminator', '1956-09-26', NULL, 'linda_hamilton.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000011, 'Harrison Ford', 'American actor known for his roles in Indiana Jones and Star Wars', '1942-07-13', NULL, 'harrison_ford.jpg');
INSERT INTO public.actors (actorid, name, bio, birthdate, deathdate, pictureurl) VALUES (4000012, 'John Travolta', 'American actor known for his role  in Pulp Fiction', '1954-02-18', NULL, 'john_travolta.jpg');


--
-- TOC entry 4884 (class 0 OID 27473)
-- Dependencies: 218
-- Data for Name: directors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200001, 'Christopher Nolan', 'British-American film director known for his complex, mind-bending plots and visual style.', '1970-07-30', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200002, 'Gore Verbinski', 'American film director known for his work on the Pirates of the Caribbean films.', '1964-03-16', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200003, 'Ben Stiller', 'American actor, comedian, and director.', '1965-11-30', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200004, 'Hayao Miyazaki', 'Japanese animation director, known for his imaginative and beautifully animated films.', '1941-01-05', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200005, 'Andrew Stanton', 'American film director, screenwriter, producer,', '1965-12-03', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200006, 'Alfonso Cuarón', 'Mexican film director, screenwriter, producer, cinematographer, and editor.', '1961-11-28', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200007, 'Steven Spielberg', 'American director and producer, one of the most commercially successful  directors in history.', '1946-12-18', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200008, 'Bryan Singer', 'American film director, producer, and screenwriter.', '1965-09-17', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200009, 'Tim Burton', 'American film director, producer, writer, and artist known for his dark and quirky fantasy films.', '1958-08-25', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200010, 'Peter Jackson', 'New Zealand film director, screenwriter, and film producer, known for The Lord of the Rings trilogy.', NULL, NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200011, 'Shawn Levy', 'Canadian film director and producer.', NULL, NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200012, 'James Wan', 'Malaysian-born Australian film director, screenwriter, and producer, known for his horror films.', '1977-01-27', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200013, 'Damien Chazelle', 'American film director and screenwriter known for his films about music.', '1985-01-19', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200014, 'Paul Thomas Anderson', 'American film director, screenwriter, and producer.', '1970-06-26', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200015, 'Quentin Tarantino', 'American film director, screenwriter, producer, and actor known for his stylized films.', '1963-03-27', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200016, 'Martin Scorsese', 'American film director, producer, and screenwriter, known for his films about crime and New York City.', '1942-11-17', NULL);
INSERT INTO public.directors (directorid, name, bio, birthyear, deathyear) VALUES (200017, 'Robert Zemeckis', 'American film director and producer', '1951-05-14', NULL);


--
-- TOC entry 4883 (class 0 OID 27466)
-- Dependencies: 217
-- Data for Name: genres; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.genres (genreid, name, description) VALUES (100001, 'Action', 'Films involving high-stakes, physical feats and battles.');
INSERT INTO public.genres (genreid, name, description) VALUES (100002, 'Drama', 'Films focused on character development and emotional themes.');
INSERT INTO public.genres (genreid, name, description) VALUES (100003, 'Crime', 'Films centered around illegal activities and investigations.');
INSERT INTO public.genres (genreid, name, description) VALUES (100004, 'Adventure', 'Films involving exciting journeys and exploration.');
INSERT INTO public.genres (genreid, name, description) VALUES (100005, 'Sci-Fi', 'Films based on imagined future scientific or technological advances.');


--
-- TOC entry 4889 (class 0 OID 27526)
-- Dependencies: 223
-- Data for Name: moviecast; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.moviecast (castid, movieid, actorid) VALUES (1, 1, 4000003);
INSERT INTO public.moviecast (castid, movieid, actorid) VALUES (2, 2, 4000001);
INSERT INTO public.moviecast (castid, movieid, actorid) VALUES (3, 2, 4000002);
INSERT INTO public.moviecast (castid, movieid, actorid) VALUES (4, 5, 4000005);
INSERT INTO public.moviecast (castid, movieid, actorid) VALUES (5, 5, 4000006);


--
-- TOC entry 4886 (class 0 OID 27487)
-- Dependencies: 220
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (1, 'Die Hard', 'A New York cop battles terrorists in a Los Angeles skyscraper.', 200001, 100001, 'diehard.png', true, 1988, 8.2);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (2, 'Mad Max: Fury Road', 'A post-apocalyptic road warrior fights for survival.', 200002, 100001, 'madmaxfuryroad.png', true, 2015, 8.1);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (4, 'Terminator 2: Judgment Day', 'A cyborg is sent to protect the future savior of humanity.', 200009, 100001, 'terminator2.png', true, 1991, 8.5);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (5, 'John Wick', 'A retired hitman seeks vengeance for his dog.', 200005, 100001, 'johnwick.png', true, 2014, 7.4);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (6, 'Pulp Fiction', 'Interconnected stories of crime and redemption in Los Angeles.', 200015, 100003, 'pulpfiction.png', true, 1994, 8.9);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (7, 'The Departed', 'An undercover cop and a mole in the police force try to identify each other.', 200016, 100003, 'thedeparted.png', true, 2006, 8.5);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (8, 'The Silence of the Lambs', 'A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal to catch another serial killer.', 200016, 100003, 'url-to-image', true, 1991, 8.6);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (9, 'No Country for Old Men', 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash.', 200016, 100003, 'url-to-image', true, 2007, 8.2);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (10, 'Indiana Jones: Raiders of the Lost Ark', 'An archaeologist embarks on a dangerous mission to find the lost Ark of the Covenant.', 200007, 100004, 'indianajones.png', true, 1981, 8.4);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (11, 'Pirates of the Caribbean', 'A pirate captain must save his crew and find treasure.', 200002, 100004, 'piratesofthecaribbean.png', true, 2003, 8);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (12, 'The Lord of the Rings: The Fellowship of the Ring', 'A group of adventurers try to destroy a powerful ring.', 200010, 100004, 'lordoftherings.png', true, 2001, 8.8);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (13, 'The Secret Life of Walter Mitty', 'A man escapes his humdrum life through vivid daydreams.', 200003, 100004, 'waltermitty.png', true, 2013, 7.3);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (14, 'La La Land', 'A musician and an aspiring actress fall in love in Los Angeles.', 200013, 100002, 'lalaland.png', true, 2016, 8);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (15, 'There Will Be Blood', 'The ruthless pursuit of wealth of an ambitious oilman changes his family and community.', 200014, 100002, 'therewillbeblood.png', true, 2007, 8.2);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (16, 'Marriage Story', 'A couple navigates a coast-to-coast divorce that pushes them to their personal and emotional extremes.', 200001, 100002, 'url-to-image', true, 2019, 7.9);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (17, 'Little Women', 'Four sisters come of age in America in the aftermath of the Civil War.', 200001, 100002, 'url-to-image', true, 2019, 7.8);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (18, 'Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the impossible task of planting an idea into the mind of a C.E.O.', 200001, 100005, 'url-to-image', true, 2010, 8.8);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (19, 'Arrival', 'A linguist is recruited by the U.S. military to communicate with the alien race who arrive on Earth.', 200001, 100005, 'url-to-image', true, 2016, 7.9);
INSERT INTO public.movies (movieid, title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES (20, 'Alien', 'The crew of a commercial spaceship encounter a deadly lifeform after investigating a distress call.', 200001, 100005, 'url-to-image', true, 1979, 8.5);


--
-- TOC entry 4887 (class 0 OID 27504)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (userid, username, email, firstname, lastname) VALUES (300001, 'BenFran', 'ben@the founder.com', 'Benjamin', 'Franklin');
INSERT INTO public.users (userid, username, email, firstname, lastname) VALUES (300002, 'DrMartLutKing', 'DrMartinLKing@thefither.com', 'Dr. Martin Luther', 'King');
INSERT INTO public.users (userid, username, email, firstname, lastname) VALUES (300003, 'SimoBolo', 'Simon.Bolivar@liberrtador.com', 'Simon', 'Bolivar');
INSERT INTO public.users (userid, username, email, firstname, lastname) VALUES (300004, 'MaGha', 'MahatmaGhandi@peace.com', 'Mahatma', 'Ghandi');
INSERT INTO public.users (userid, username, email, firstname, lastname) VALUES (300005, 'Krishna', 'Vishnu@india.com', 'M.V', 'Krishna');


--
-- TOC entry 4888 (class 0 OID 27511)
-- Dependencies: 222
-- Data for Name: usersmovies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500001, 300001, 1);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500003, 300002, 6);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500004, 300002, 7);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500005, 300003, 10);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500006, 300003, 11);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500007, 300004, 14);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500008, 300004, 15);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500009, 300005, 18);
INSERT INTO public.usersmovies (usermovieid, userid, movieid) VALUES (500010, 300005, 19);


--
-- TOC entry 4723 (class 2606 OID 27486)
-- Name: actors actors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actors
    ADD CONSTRAINT actors_pkey PRIMARY KEY (actorid);


--
-- TOC entry 4721 (class 2606 OID 27479)
-- Name: directors directors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.directors
    ADD CONSTRAINT directors_pkey PRIMARY KEY (directorid);


--
-- TOC entry 4719 (class 2606 OID 27472)
-- Name: genres genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (genreid);


--
-- TOC entry 4731 (class 2606 OID 27530)
-- Name: moviecast moviecast_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moviecast
    ADD CONSTRAINT moviecast_pkey PRIMARY KEY (castid);


--
-- TOC entry 4725 (class 2606 OID 27493)
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (movieid);


--
-- TOC entry 4727 (class 2606 OID 27510)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 4729 (class 2606 OID 27515)
-- Name: usersmovies usersmovies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersmovies
    ADD CONSTRAINT usersmovies_pkey PRIMARY KEY (usermovieid);


--
-- TOC entry 4736 (class 2606 OID 27536)
-- Name: moviecast moviecast_actorid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moviecast
    ADD CONSTRAINT moviecast_actorid_fkey FOREIGN KEY (actorid) REFERENCES public.actors(actorid);


--
-- TOC entry 4737 (class 2606 OID 27531)
-- Name: moviecast moviecast_movieid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moviecast
    ADD CONSTRAINT moviecast_movieid_fkey FOREIGN KEY (movieid) REFERENCES public.movies(movieid);


--
-- TOC entry 4732 (class 2606 OID 27494)
-- Name: movies movies_directorid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_directorid_fkey FOREIGN KEY (directorid) REFERENCES public.directors(directorid);


--
-- TOC entry 4733 (class 2606 OID 27499)
-- Name: movies movies_genreid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_genreid_fkey FOREIGN KEY (genreid) REFERENCES public.genres(genreid);


--
-- TOC entry 4734 (class 2606 OID 27521)
-- Name: usersmovies usersmovies_movieid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersmovies
    ADD CONSTRAINT usersmovies_movieid_fkey FOREIGN KEY (movieid) REFERENCES public.movies(movieid);


--
-- TOC entry 4735 (class 2606 OID 27516)
-- Name: usersmovies usersmovies_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usersmovies
    ADD CONSTRAINT usersmovies_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


-- Completed on 2025-03-24 19:12:06

--
-- PostgreSQL database dump complete
--

