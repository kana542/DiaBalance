*** Settings ***
Library     Browser    auto_closing_level=KEEP
Variables   ../resources/env_variables.py
Resource    ../resources/loginWithRegister.resource
Resource    ../resources/logoutKeywords.resource 


*** Test Cases ***
Test logout_after_login
    Avaa Sovellus
    Click    role=link[name="KIRJAUDU / REKISTERÖIDY"]
    Sleep    1s

    Kirjaudu sovellukseen rekisteröidyillä tunnuksilla
    Vahvista Kirjautuminen Onnistui
    Kirjaudu ulos sovelluksesta
