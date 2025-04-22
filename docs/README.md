# Robot Framework -testaus

Tässä projektissa on toteutettu automaatiotestit käyttöliittymän toiminnoille Robot Frameworkin ja Browser-kirjaston avulla.

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
2. Sisäänkirjautuminen KI_1
   - Epäonnistunut kirjautuminen
   - Onnistunut kirjautuminen
3. Uuden kalenterimerkinnän lisääminen ja tallentaminen DI_1
4. Kalenterimerkinnän avaus/muokkaaminen DO_1
5. Kalenterimerkinnän poistaminen DI_2
6. HRV-datan hakeminen Kubioksesta
7. Uloskirjautuminen

Testit on ajettu suoraan projektin juuresta, ja tulokset ohjattu `docs/`-kansioon GitHub Pages -julkaisua varten.

## Testit

`login_fail` Epäonnistunut kirjautuminen  
![login FAIL](screenshots/login_FAIL.png)

`login_success` Onnistunut kirjautumisen testi  
![login SUCCESS](screenshots/login_SUCCESS.png)

## Testitulokset

### Rekisteröityminen sovellukseen

```bash
robot --pythonpath . --log log_register_success.html --report report_register_success.html --outputdir docs tests/frontend/register_success.robot
```
- [HTML-raportti](report_register_success.html)
- [Loki](log_register_success.html)

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

### uuden kalenterimerkinnän lisääminen

```bash
robot --pythonpath . --log log_new_entry.html --report report_new_entry.html --outputdir docs tests/frontend/new_entry.robot
```
- [HTML-raportti](report_new_entry.html)
- [Loki](log_new_entry.html)

### olemassa olevan kalenterimerkinnän muokkaaminen ja tallennus

```bash
robot --pythonpath . --log log_update_entry.html --report report_update_entry.html --outputdir docs tests/frontend/update_entry.robot
```
- [HTML-raportti](report_update_entry.html)
- [Loki](log_update_entry.html)


### olemassa olevan kalenterimerkinnän poistaminen

```bash
robot --pythonpath . --log log_delete_entry.html --report report_delete_entry.html --outputdir docs tests/frontend/delete_entry.robot
```
- [HTML-raportti](report_delete_entry.html)
- [Loki](log_delete_entry.html)

### HRV-datan hakeminen Kubioksesta ja sen tallennus

```bash
robot --pythonpath . --log log_get_HRV_data.html --report report_get_HRV_data.html --outputdir docs tests/frontend/get_HRV_data.robot
```
- [HTML-raportti](report_delete_entry.html)
- [Loki](log_delete_entry.html)

### Kirjautuminen ulos sovelluksesta

```bash
robot --pythonpath . --log log_logout.html --report report_logout.html --outputdir docs tests/frontend/log_out.robot
```
- [HTML-raportti](report_logout.html)
- [Loki](log_logout.html)



## Testitiedostojen sijainti

- Testit: [`tests/frontend/`](../tests/frontend/)
- Resurssit: [`resources/`](../resources/)
- Tulokset ja julkaisu: [`docs/`](../docs/)

