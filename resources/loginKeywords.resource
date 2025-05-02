*** Settings ***
Variables    resources/env_variables.py

*** Keywords ***
Avaa Sovellus
    New Browser    chromium    headless=No
    New Page       http://localhost:3001/
    Sleep   1s

Kirjaudu Sovellukseen
    Type Text      id=email        ${EMAIL}    delay=0.1s
    Type Secret    id=password     $PASSWORD    delay=0.1s
    Click          button:has-text("Kirjaudu")
    Sleep          1s

Vahvista Kirjautuminen Onnistui
    Wait For Elements State    text="Kirjautuminen onnistui"    visible    timeout=5s






