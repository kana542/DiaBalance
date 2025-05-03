*** Settings ***
Variables    ../variables/env_variables.py

*** Keywords ***
Kirjaudu ulos sovelluksesta
    Sleep   2s
    Click    text=Kirjaudu ulos
    