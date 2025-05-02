*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../../resources/register.resource

*** Test Cases ***
Test register new user
    Avaa Sovellus
    Click    role=link[name="KIRJAUDU / REKISTERÖIDY"]
    Sleep    1s

    Rekisteröidy sovellukseen
