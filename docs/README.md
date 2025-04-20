# Robot Framework -testaus

Tässä projektissa on toteutettu automaatiotestit käyttöliittymän kirjautumisprosessille Robot Frameworkin ja Browser-kirjaston avulla.

Projektiin liittyvät Python-kirjastot on määritelty tiedostossa `requirements.txt`.

### Virtuaaliympäristön aktivointi

Windowsissa (esim. PowerShellissä tai Git Bashissa):
```bash
source .venv/Scripts/activate
```

### Asenna riippuvuudet
```bash
pip install -r requirements.txt
```


## Testattavat käyttötapaukset

Seuraavat toiminnallisuudet testataan automaattisesti Robot Frameworkin avulla:

1. Rekisteröityminen
2. Sisäänkirjautuminen
   - Epäonnistunut kirjautuminen
   - Onnistunut kirjautuminen
3. Uuden kalenterimerkinnän lisääminen
4. Kalenterimerkinnän muokkaaminen
5. Kalenterimerkinnän poistaminen

Testit on ajettu suoraan projektin juuresta, ja tulokset ohjattu `docs/`-kansioon GitHub Pages -julkaisua varten.

## Testit

`login_fail` Epäonnistunut kirjautuminen  
![login FAIL](screenshots/login_FAIL.png)

`login_success` Onnistunut kirjautumisen testi  
![login SUCCESS](screenshots/login_SUCCESS.png)

## Testitulokset

### Epäonnistunut kirjautuminen

```bash
robot --pythonpath . --log log_login_fail.html --report report_login_fail.html --outputdir docs tests/frontend/login_fail.robot
```

- [HTML-raportti](report_login_fail.html)
- [Loki](log_login_fail.html)

### Onnistunut kirjautuminen

```bash
robot --pythonpath . --log log_login_success.html --report report_login_success.html --outputdir docs tests/frontend/login_success.robot
```

- [HTML-raportti](report_login_success.html)
- [Loki](log_login_success.html)

## Testitiedostojen sijainti

- Testit: [`tests/frontend/`](./tests/frontend/)
- Resurssit: [`resources/`](./resources/)
- Tulokset ja julkaisu: [`docs/`](./docs/)

