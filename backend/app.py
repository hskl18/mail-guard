import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, status, Form, Body
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import requests
import logging
import os
import uuid
from typing import Dict
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from database import (
    setup_database,

    get_user_by_username,
    get_user_by_id,
    create_user,
    get_all_users,
    get_id_by_user,

    create_session,
    get_session,
    delete_session,
    
    get_user_devices,
    add_user_device,
    delete_user_device,
    get_device,
    get_devices,

    get_all_data,
    get_user_sensor_data,
    add_user_sensor_data,
)

logger = logging.getLogger(__name__)

load_dotenv()

# TODO: 1. create your own user
INIT_USERS = {"alice": "pass123", "bob": "pass456", "michael": "testtest1232"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for managing application startup and shutdown.
    Handles database setup and cleanup in a more structured way.
    """
    # Startup: Setup resources
    try:
        await setup_database(INIT_USERS)  # Make sure setup_database is async
        # await setup_database()  # Make sure setup_database is async
        print("Database setup completed")
        yield
    finally:
        print("Shutdown completed")

AI_API_URL = "https://ece140-wi25-api.frosty-sky-f43d.workers.dev/api/v1/ai/complete"
EMAIL = "mdimapilis@ucsd.edu"
PID = "A17362627" 
# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Static file helpers
def read_html(file_path: str) -> str:
    with open(file_path, "r") as f:
        return f.read()


def get_error_html(username: str) -> str:
    error_html = read_html("./templates/error.html")
    return error_html.replace("{username}", username)

####### LANDING PAGE ########
@app.get("/")
async def root(request: Request):
    """route users to /landing"""
    # TODO: 2. Implement this route
    return templates.TemplateResponse("/landing.html", {"request": request})


###### LOGIN #######

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Show login if not logged in, or redirect to profile page"""
    # TODO: 3. check if sessionId is in attached cookies and validate it
    # if all valid, redirect to /user/{username}
    # if not, show login page
    sessionId = await get_session(request.cookies.get("sessionId"))
    if sessionId:
        user = await get_user_by_id(sessionId["user_id"])
        username = user["email"]
        return RedirectResponse(url=f"/user/{username}")
    # return HTMLResponse(content=read_html("./templates/loginPage.html"))
    return templates.TemplateResponse("/loginPage.html", {"request": request})


@app.post("/login")
async def login(request: Request):
    """Validate credentials and create a new session if valid"""
    # TODO: 4. Get username and password from form data
    username = (await request.form()).get("usernameLog")
    #print(username)
    password = (await request.form()).get("passwordLog")
    # TODO: 5. Check if username exists and password matches
    checkUser = await get_user_by_username(username)
    if not checkUser or checkUser["password"] != password:
        return HTMLResponse(get_error_html(username))
    # TODO: 6. Create a new session
    sessionId = str(uuid.uuid4())
    await create_session(checkUser["id"], sessionId)
    # TODO: 7. Create response with:
    #   - redirect to /user/{username}
    #   - set cookie with session ID
    #   - return the response
    response = RedirectResponse(url=f"/user/{username}", status_code=303)
    response.set_cookie(key="sessionId", value=sessionId)
    return response

##### LOGOUT #######

@app.post("/logout")
async def logout():
    """Clear session and redirect to login page"""
    # TODO: 8. Create redirect response to /login
    redirect = RedirectResponse(url="/login", status_code=302)
    # TODO: 9. Delete sessionId cookie
    redirect.delete_cookie(key="sessionId")
    # TODO: 10. Return response
    return redirect


####### SIGNUP #######

@app.get("/signup")
async def signup_page(request: Request):
    return templates.TemplateResponse("/signUpPage.html", {"request": request})

@app.post("/signup")
async def signup(request: Request, firstName: str=Form(...), lastName: str=Form(...),
                 email: str=Form(...), passwordVerify: str=Form(...)):
    existing_user = await get_user_by_username(email)
    if existing_user:
        return HTMLResponse("<p>User already exists. Try again.</p>", status_code=400)
    
    await create_user(firstName, lastName, email, passwordVerify)

    new_user_id = await get_user_by_username(email)
    print(new_user_id)
    sessionId = str(uuid.uuid4())
    await create_session(new_user_id["id"], sessionId)

    response = RedirectResponse(url=f"/user/{email}", status_code=303)
    response.set_cookie(key="sessionId", value=sessionId)
    return response


#### TESTING to SEE USERS TABLE ######

@app.get("/all-users")
async def all_users():
    users = await get_all_users()
    if users is None:
        return {"message": "Could not retrieve users"}
    
    return {"users": users}

###### ROUTE TO USER PAGE AFTER SUCCESSFUL LOGIN ######

@app.get("/user/{username}", response_class=HTMLResponse)
async def user_page(username: str, request: Request):
    """Show user profile if authenticated, error if not"""
    # TODO: 11. Get sessionId from cookies
    sessionId = request.cookies.get("sessionId")
    # TODO: 12. Check if sessionId exists and is valid
    #   - if not, redirect to /login 
    session = await get_session(sessionId)
    if not session:
        return RedirectResponse("/login")
    # TODO: 13. Check if session username matches URL username
    #   - if not, return error page using get_error_html with 403 status
    getUser = await get_user_by_id(session["user_id"])
    if getUser is None or getUser["email"] != username:
        return HTMLResponse(content=get_error_html(username), status_code=403)
    # TODO: 14. If all valid, show profile page
    user_data = {"firstName": getUser["firstName"], 
             "lastName": getUser["lastName"], 
             "email": getUser["email"]}
    return templates.TemplateResponse("dashboard.html", {"request": request, "user_data": user_data})
        # profile = read_html("./templates/dashboard.html")
        # return HTMLResponse(content=profile.replace("{username}", username))
    

###### PROFILE TO ADD/DELETE DEVICES #########

@app.get("/profile/{username}", response_class=HTMLResponse)
async def profile(username: str, request: Request):

    sessionId = request.cookies.get("sessionId")

    session = await get_session(sessionId)

    if not session:
        return RedirectResponse("/login")
    
    getUser = await get_user_by_id(session["user_id"])
    if getUser is None or getUser["email"] != username:
        return HTMLResponse(content=get_error_html(username), status_code=403)
    # print(getUser)
    user_data = {"firstName": getUser["firstName"], 
                 "lastName": getUser["lastName"], 
                 "email": getUser["email"]}
    
    devices = await get_user_devices(session["user_id"])

    return templates.TemplateResponse("/profile.html", {"request": request, "user_data": user_data, "devices": devices})

@app.post("/profile/{username}", response_class=HTMLResponse)
async def add_device(request: Request, username: str, deviceId: str=Form(...), deviceTopic: str=Form(...)):
    user_id = await get_id_by_user(username)
    existing_device = await get_device(deviceId, user_id["id"])

    if existing_device:
        return HTMLResponse("<p>Device already exists. Try again.</p>", status_code=400)
    
    await add_user_device(deviceId, user_id["id"], deviceTopic, "active")
    return RedirectResponse(url=f"/profile/{username}", status_code=303)

@app.delete("/profile/{username}/{id}")
async def delete_device(username: str, id: str):
    user_id = await get_id_by_user(username)
    print(user_id)
    existing_device = await get_device(id, user_id["id"])
    if existing_device is None:
        # return JSONResponse(status_code=404, content={"error": "Device not found"})
        return HTMLResponse("<p>Device not found. Try again.</p>", status_code=404)
    
    await delete_user_device(id, user_id["id"])
    # return JSONResponse(status_code=200, content={"message": "Device removed successfully"})
    return RedirectResponse(url=f"/profile/{username}", status_code=303)

@app.get("/all-user-devices")
async def all_user_devices():
    devices = await get_devices()
    if devices is None:
        return {"message": "Could not retrieve devices"}
    
    return {"devices": devices}
    

##### WARDROBE #########

@app.get("/wardrobe/{username}", response_class=HTMLResponse)
async def wardrobe(username: str, request: Request):
    sessionId = request.cookies.get("sessionId")

    session = await get_session(sessionId)

    if not session:
        return RedirectResponse("/login")
    
    getUser = await get_user_by_id(session["user_id"])
    if getUser is None or getUser["email"] != username:
        return HTMLResponse(content=get_error_html(username), status_code=403)
    
    return templates.TemplateResponse("/wardrobe.html", {"request": request})

@app.post("/api/wardrobe/add")
async def add_item(
    request: Request,
    username: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    size: str = Form(...)):
    """Add a new clothing item to the user's wardrobe"""
    user = await get_id_by_user(username)
    if not user:
        return JSONResponse(content={"error": "User not found"}, status_code=404)
    
    await add_wardrobe_item(user["id"], name, category, size)
    return JSONResponse(content={"message": "Item added successfully"}, status_code=201)

@app.delete("/api/wardrobe/remove/{name}")
async def remove_item(request: Request, name: str):
    """Remove a clothing item from the user's wardrobe"""
    sessionId = request.cookies.get("sessionId")

    session = await get_session(sessionId)

    if not session:
        return RedirectResponse("/login")
    
    getUser = await get_user_by_id(session["user_id"])
    if getUser is None:
        raise HTTPException(status_code=404, detail="User not found")
    await remove_wardrobe_item(getUser["id"], name.lower())
    return JSONResponse(content={"message": "Item removed successfully"}, status_code=200)

@app.put("/api/wardrobe/update")
async def update_item(
    request: Request,
    old_name: str = Form(...),
    new_name: str = Form(...)):
    """Update a clothing item's name in the wardrobe"""
    sessionId = request.cookies.get("sessionId")

    session = await get_session(sessionId)

    if not session:
        return RedirectResponse("/login")
    
    getUser = await get_user_by_id(session["user_id"])
    if getUser is None:
        raise HTTPException(status_code=404, detail="User not found")
    await update_wardrobe_item(getUser["id"], old_name, new_name)
    return JSONResponse(content={"message": "Item updated successfully"}, status_code=200)

@app.get("/api/wardrobe")
async def get_user_wardrobe_items(request: Request):
    sessionId = request.cookies.get("sessionId")

    session = await get_session(sessionId)

    if not session:
        return RedirectResponse("/login")
    
    getUser = await get_user_by_id(session["user_id"])
    if getUser is None:
        raise HTTPException(status_code=404, detail="User not found")
    wardrobe_items = await get_user_wardrobe(getUser["id"])
    return JSONResponse(content=wardrobe_items, status_code=200)


####### SENSOR DATA #######
@app.get("/sensor_data")
async def sensorData():
    try:
        all_data = await get_all_data()
        
        if not all_data:
            raise HTTPException(status_code=404, detail="No sensor data found")

        return all_data
        # keys = ["id", "user_id", "device_id", "sensor_type", "value", "unit", "curr_time"]
        # converted_data = [dict(zip(keys, row)) for row in all_data]

        # for entry in converted_data:
        #     if isinstance(entry["curr_time"], datetime):
        #         entry["curr_time"] = entry["curr_time"].strftime('%Y-%m-%d %H:%M:%S')

        # return converted_data

    except Exception as e:
        logging.error(f"Database error: {str(e)}")  # Logs the actual error
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # sessionId = request.cookies.get("sessionId")

    # session = await get_session(sessionId)

    # if not session:
    #     return RedirectResponse("/login")
    
    # getUser = await get_user_by_id(session["user_id"])
    # if getUser is None or getUser["email"] != username:
    #     return HTMLResponse(content=get_error_html(username), status_code=403)
    # return templates.TemplateResponse("/dashboard.html", {"request": request})


@app.post("/api/sensor_data/add")
def add_sensor_data(
    value: float = Body(...)):
    
    add_user_sensor_data(value)
    return JSONResponse(content={"message": "Data added successfully"}, status_code=201)

@app.get("/api/userId")
async def get_user(request: Request):
    print(f"Session cookie: {request.cookies.get("sessionId")}")
    sessionId = await get_session(request.cookies.get("sessionId"))
    print(f"Session: {sessionId}")
    if sessionId:
        user = await get_user_by_id(sessionId["user_id"])
        print(f"User: {user}")
        userId = user["id"]
        return JSONResponse(content={"userId": userId})
    return JSONResponse(status_code=401, content={"error": "Invalid session"})

####### AI API #######
@app.post("/api/ai/query")
async def ai_request(request: Request):
    try:
        data = await request.json()
        prompt = data.get("prompt")

        response = requests.post(
            AI_API_URL,
            headers= {
                "Content-Type": "application/json",
                "email": EMAIL,
                "pid": PID
            },
            json={"prompt": prompt},
        )

        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="AI API request failed")

        return response.json()
    except Exception as e:
        logger.error(f"Error processing AI request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

#### TESTING  #######
@app.get("/all-clothes")
async def all_clothes():
    users = await get_wardrobe()
    if users is None:
        return {"message": "Could not retrieve users"}
    
    return {"users": users}

@app.get("/api/user/me")
async def get_user(request: Request):
    sessionId = await get_session(request.cookies.get("sessionId"))
    if sessionId:
        user = await get_user_by_id(sessionId["user_id"])
        username = user["email"]
        return JSONResponse(content={"username": username})
    return HTTPException(status_code=404, detail="Not found")

@app.get("/all-data")
async def all_sensor_data():
    sensor_data = await get_all_data()
    if sensor_data is None:
        return {"message": "Could not retrieve all sensor data"}
    return {"sensor_data": sensor_data}

if __name__ == "__main__":
    uvicorn.run("app:app", host="localhost", port=8000, reload=True)
