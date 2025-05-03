*** Settings ***
Variables    ../variables/env_variables.py

*** Keywords ***
Avaa Sovellus
    New Browser    chromium    headless=No
    New Page       http://localhost:3001/
    Sleep   1s

Rekisteröidy sovellukseen
    Click    css=a[href="register.html"]


    Type Text    id=username          ${REGISTER_USERNAME}      delay=0.3s
    Type Text    id=email             ${REGISTER_EMAIL}         delay=0.3s     
    Type Secret  id=password          $REGISTER_PASSWORD        delay=0.3s
    Type Secret  id=confirmPassword   $REGISTER_PASSWORD        delay=0.3s
    
    Click   text=Luo tunnus

