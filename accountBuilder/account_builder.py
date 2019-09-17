import subprocess

import pymongo
from random_username.generate import generate_username

from credentials import credentials


def create_account(username, password):
    date = '2/9/1997'
    my_cmd = ['bbf', 'create', '--username=' + username, '--password=' + password, '--date=' + date]
    return subprocess.run(my_cmd, stdout=subprocess.PIPE).stdout.decode('utf-8')


if __name__ == "__main__":
    client = pymongo.MongoClient(host=credentials['mongo']['host'], port=credentials['mongo']['port'],
                                 username=credentials['mongo']['username'], password=credentials['mongo']['password'])

    username = generate_username(1)[0]
    password = generate_username(1)[0]

    result = create_account(username, password)
    print(result)

    while 'Account was successfully created' not in result:
        if 'pas disponible' not in result:
            raise ValueError(result)

        username = generate_username(1)[0]
        result = create_account(username, password)
        print(result)

    post = {
        "username": username,
        "password": password,
    }

    client.blackfalcon.account.insert_one(post)
