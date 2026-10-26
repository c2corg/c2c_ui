"""Create the e2e user in a local v6_api database."""
# Run it in the v6_api environment:
#   E2E_PASSWORD=... python create-user.py [path/to/development.ini]  (default: ./development.ini)
# E2E_USERNAME and E2E_PASSWORD are the ones the tests use (e2e/api.mjs)
import datetime
import os
import sys

import transaction
from pyramid.paster import get_appsettings
from sqlalchemy import engine_from_config

from c2corg_api.models import DBSession
from c2corg_api.models.document import DocumentGeometry, DocumentLocale
from c2corg_api.models.user import User
from c2corg_api.models.user_profile import UserProfile

USERNAME = os.environ.get('E2E_USERNAME', 'e2etester')
PASSWORD = os.environ['E2E_PASSWORD']

settings = get_appsettings(sys.argv[1] if len(sys.argv) > 1 else 'development.ini')
DBSession.configure(bind=engine_from_config(settings, 'sqlalchemy.'))
with transaction.manager:
    if DBSession.query(User).filter(User.username == USERNAME).count():
        print(f'{USERNAME} already exists')
    else:
        profile = UserProfile(
            categories=['amateur'],
            locales=[DocumentLocale(title='', description='e2e', lang='fr')],
            geometry=DocumentGeometry(geom='SRID=3857;POINT(635956 5723604)'))
        DBSession.add(User(
            name='E2E Tester', username=USERNAME, email=f'{USERNAME}@example.invalid',
            forum_username=USERNAME, password=PASSWORD,
            tos_validated=datetime.datetime(2026, 1, 1), email_validated=True,
            moderator=False, profile=profile))
        print(f'{USERNAME} created')
