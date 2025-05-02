*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../resources/loginKeywords.resource

*** Test Cases ***
Test login_success
    Avaa Sovellus
    Click    role=link[name="KIRJAUDU / REKISTERÖIDY"]
    Sleep    1s
    Kirjaudu Sovellukseen
    Vahvista Kirjautuminen Onnistui


    