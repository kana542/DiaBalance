*** Settings ***
Library     Browser    auto_closing_level=KEEP
Resource    ../resources/loginKeywords.resource
Resource    ../resources/calendarKeywords.resource

*** Test Cases ***
Test new_entry
    Avaa Sovellus
    Click    role=link[name="KIRJAUDU / REKISTERÖIDY"]
    Sleep    1s
    Kirjaudu Sovellukseen
    Vahvista Kirjautuminen Onnistui

    #Tästä alkaa uuden merkinnän lisääminen
    Siirry kalenteriin ja valitse päivä     2025-04-22
    Tee uusi merkintä
    Tallenna merkintä
    
    


    