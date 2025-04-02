-- TIEDOSTO: diabalance.sql
-- TARKOITUS: Tietokannan luonti ja alustaminen Diabalance-sovellukselle

-- DROP DATABASE IF EXISTS diabalance;
CREATE DATABASE diabalance;
USE diabalance;

--TAULUJEN LUONTI

CREATE TABLE kayttaja ( 
	kayttaja_id INT AUTO_INCREMENT, 
	kayttajanimi VARCHAR(40) NOT NULL, 
	salasana VARCHAR(60) NOT NULL, 
	kayttajarooli INT NOT NULL DEFAULT 0, 
	CONSTRAINT pk_kayttaja PRIMARY KEY (kayttaja_id), 
	CONSTRAINT oikea_rooli CHECK(kayttajarooli>=0 AND kayttajarooli<=2)
);

CREATE TABLE kirjaus ( 
	kayttaja_id INT NOT NULL,
	pvm DATE NOT NULL DEFAULT CURRENT_DATE(), 
	hrv_data TEXT, 
	vs_aamu DECIMAL(3, 1), 
	vs_ilta DECIMAL(3, 1), 
	vs_aamupala_ennen DECIMAL(3, 1), 
	vs_aamupala_jalkeen DECIMAL(3, 1), 
	vs_lounas_ennen DECIMAL(3, 1), 
	vs_lounas_jalkeen DECIMAL(3, 1), 
	vs_valipala_ennen DECIMAL(3, 1), 
	vs_valipala_jalkeen DECIMAL(3, 1), 
	vs_paivallinen_ennen DECIMAL(3, 1), 
	vs_paivallinen_jalkeen DECIMAL(3, 1), 
	vs_iltapala_ennen DECIMAL(3, 1), 
	vs_iltapala_jalkeen DECIMAL(3, 1), 
	oireet VARCHAR(200) DEFAULT "Ei oireita",
	kommentti VARCHAR(500) DEFAULT "Ei kommentteja",
	CONSTRAINT pk_kirjaus PRIMARY KEY (kayttaja_id, pvm), 
	CONSTRAINT fk_kirjaus_kayttaja 
	FOREIGN KEY (kayttaja_id) 
	REFERENCES kayttaja(kayttaja_id)
	ON DELETE CASCADE
	ON UPDATE CASCADE, 
	INDEX idx_pvm (pvm)
);


CREATE TABLE potilas_hoitaja (
	hoidonseuraaja INT NOT NULL,
	potilas INT NOT NULL,
	CONSTRAINT pk_potilas_hoitaja PRIMARY KEY (hoidonseuraaja, potilas),
	CONSTRAINT fk_hoidonseuraaja 
	FOREIGN KEY (hoidonseuraaja) 
	REFERENCES kayttaja(kayttaja_id)
	ON DELETE CASCADE
	ON UPDATE CASCADE, 
	CONSTRAINT fk_potilas 
	FOREIGN KEY (potilas) 
	REFERENCES kayttaja(kayttaja_id)
	ON DELETE CASCADE
	ON UPDATE CASCADE, 
	INDEX idx_potilas (potilas)
);



CREATE TABLE ajanvaraus (
	hoidonseuraaja INT NOT NULL,
	potilas INT NOT NULL,
	ajanvaraus_pvm DATE NOT NULL,
	ajanvaraus_aloitus TIME NOT NULL,
	ajanvaraus_lopetus TIME NOT NULL,
	CONSTRAINT pk_ajanvaraus PRIMARY KEY (hoidonseuraaja, potilas, ajanvaraus_pvm, ajanvaraus_aloitus),
	CONSTRAINT fk_ajanvaraus_potilas_hoitaja 
	FOREIGN KEY (hoidonseuraaja, potilas) 
	REFERENCES potilas_hoitaja(hoidonseuraaja, potilas)
	ON DELETE CASCADE
	ON UPDATE CASCADE,
	INDEX idx_potilas (potilas),
	INDEX idx_pvm (ajanvaraus_pvm)
);


-- TRIGGERIT
-- Triggerit tarkistavat, että käyttäjät ovat oikeassa roolissa ennen tietojen lisäämistä tietokantaan.

DELIMITER //

CREATE TRIGGER onko_potilas_kirjaus BEFORE INSERT ON kirjaus 
FOR EACH ROW 
BEGIN
	DECLARE k_rooli INT;
	SELECT kayttajarooli INTO k_rooli 
	FROM kayttaja 
	WHERE kayttaja_id = NEW.kayttaja_id; 
	IF k_rooli != 0 THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kirjauksen tekijä täytyy olla potilas'; 
	END IF; 
END;

CREATE TRIGGER onko_potilas BEFORE INSERT ON potilas_hoitaja 
FOR EACH ROW 
BEGIN
	DECLARE k_rooli INT;
	SELECT kayttajarooli INTO k_rooli 
	FROM kayttaja 
	WHERE kayttaja_id = NEW.potilas; 
	IF k_rooli != 0 THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Potilas-hoidonseuraaja suhteessa täytyy olla potilas'; 
	END IF; 
END;

CREATE TRIGGER onko_hoidonseuraaja BEFORE INSERT ON potilas_hoitaja 
FOR EACH ROW 
BEGIN
	DECLARE k_rooli INT;
	SELECT kayttajarooli INTO k_rooli 
	FROM kayttaja 
	WHERE kayttaja_id = NEW.hoidonseuraaja; 
	IF k_rooli != 1 THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Potilas-hoidonseuraaja suhteessa täytyy olla hoidonseuraaja'; 
	END IF; 
END;

CREATE TRIGGER onko_potilaalla_hoidonseuraaja BEFORE INSERT ON potilas_hoitaja 
FOR EACH ROW 
BEGIN
	DECLARE hoidonseuraaja_maara INT;
	SELECT COUNT(*) INTO hoidonseuraaja_maara 
	FROM potilas_hoitaja 
	WHERE potilas = NEW.potilas; 
	IF hoidonseuraaja_maara > 0 THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Potilaalla on jo hoidonseuraaja'; 
	END IF; 
END;

//

DELIMITER ;

