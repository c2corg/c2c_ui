WORK IN PROGRESS

Here the steps to release a new UI version on camptocamp.org

First of all, you must create a [release](https://github.com/c2corg/c2c_ui/releases) on github. Please follow [semver](https://semver.org/) logic :

* minor change, bug fix => increment last number : `X.Y.Z` >> `X.Y.Z+1`
* feature addition => increment middle number : `X.Y.Z` >> `X.Y+1.Z`
* feature deletion, major change => increment first number : `X.Y.Z` >> `X+1.Y.Z`

Then, check that docker image is ready : https://hub.docker.com/r/c2corg/c2c_ui/tags

And finally, upgrade the prod server :

```bash
# Connect to the composition management server
ssh <user_id>@compose0.exoscale.infra.camptocamp.org

# IMPORTANT : set-up env variables
source /opt/c2corg-docker/server-list.env

# Got to first UI instance
cd /opt/c2corg-docker/composition/production/ui0/

# Set container in mainternance mode (will not get new requests for Haproxy)
docker-compose exec api touch maintenance_mode.txt

# download the new image
docker-compose pull

# shutdown the running container, and restart it
docker-compose stop && docker-compose rm -f
docker-compose up -d

# make sure everything is working properly
docker-compose ps

# Perfect ! Let's do the same for api1
cd ../ui1
docker-compose exec api touch maintenance_mode.txt
docker-compose pull
docker-compose stop && docker-compose rm -f
docker-compose up -d
docker-compose ps
```
