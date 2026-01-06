import requests

url = 'http://localhost:5000/api/upload_csv'
files = {'file': ('test_data.csv', open('test_data.txt', 'rb'), 'text/csv')}
data = {'db_name': 'user_uploads'}

try:
    response = requests.post(url, files=files, data=data)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
