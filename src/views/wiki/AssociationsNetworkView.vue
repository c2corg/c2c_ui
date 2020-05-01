<template>
  <div class="section content">

    <div class="columns">
      <div class="column is-2">

        <div class="field is-horizontal">
          <div class="field-label is-small">
            <label class="label">Depth</label>
          </div>
          <div class="field-body">
            <div class="control">
              <input
                type="number"
                class="input is-small"
                min="1"
                max="8"
                v-model="depth">
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label is-small">
            <label class="label">Links</label>
          </div>
          <div class="field-body">
            <div class="control">
              <div class="select is-small">
                <select v-model="crawlMarkdownLinkInLang">
                  <option :value="null">-</option>
                  <option v-for="lang of $options.constants.langs" :key="lang" :value="lang">{{ lang }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label is-small">Association types</label>
          <div class="control">
            <div class="select is-multiple is-small">
              <select multiple v-model="includes" size="8">
                <option v-for="key of Object.keys($options.documentTypes)" :key="key" :value="key">{{ key }}s</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label is-small">Excluded Ids</label>
          <div class="control">
            <input class="input is-small" v-model="excludedDocumentIds">
          </div>
        </div>

        <div class="field">
          <div class="control">
            <button class="button is-primary is-small" @click="load" :class="{'is-loading':loading}">
              Load
            </button>
            <span>
              Loading {{ loaded }} / {{ total }}
            </span>
          </div>
        </div>

      </div>
      <div class="column is-8">
        <svg class="network-graph" :class="colorScheme" ref="svg" height="600" />
        <div class="is-family-code is-size-7">
          <div v-for="(node, i) of data.nodes" :key="i">
            <span v-if="node.document">
              <span>* </span>
              <span>
                {{ node.quality === 'empty' ? '⚫' : node.quality === 'draft' ? '🔴' : node.quality === 'medium' ? '🔶' : node.quality === 'fine' ? '💚' : node.quality === 'great' ? '⭐' : '' }}
              </span>
              <span>
                [{{ $documentUtils.getDocumentTitle(node.document) }}](https://www.camptocamp.org/{{ node.documentType }}s/{{ node.id }})
              </span>
            </span>
          </div>
        </div>
      </div>
      <div class="column is-2">

        <dropdown-button>
          <span slot="button" class="input">
            Color scheme : {{ colorScheme }}
          </span>
          <div
            v-for="scheme of ['subtype', 'quality']"
            :key="scheme"
            class="dropdown-item is-size-5"
            @click="colorScheme = scheme">
            {{ scheme }}
          </div>
        </dropdown-button>

        <!-- <div>collide.strength {{ collideStrength }}</div>
        <input
          class="range-input"
          type="range"
          min="0"
          max="3"
          step=".1"
          v-model="collideStrength"> -->

        <!-- <div>collide.radius {{ collideRadius }}</div>
        <input class="range-input" type="range" min="1" max="30" v-model="collideRadius"> -->

        <div>link.distance {{ linkDistance }}</div>
        <input
          class="range-input"
          type="range"
          min="10"
          max="100"
          v-model="linkDistance">

        <div>charge.strength {{ chargeStrength }}</div>
        <input
          class="range-input"
          type="range"
          min="-150"
          max="0"
          v-model="chargeStrength">
        <!--
        <div>charge.distanceMin {{ chargeDistanceMin }}</div>
        <input class="range-input" type="range" min="0" max="50" v-model="chargeDistanceMin"> -->

        <div>charge.distanceMax {{ chargeDistanceMax }}</div>
        <input
          class="range-input"
          type="range"
          min="0"
          max="1000"
          v-model="chargeDistanceMax">

        <document-card v-if="selectedDocument" :document="selectedDocument" />
      </div>
    </div>
  </div>
</template>

<script>
  import c2c from '@/js/apis/c2c';
  import { icon } from '@fortawesome/fontawesome-svg-core';
  import constants from '@/js/constants';

  // http://localhost:8081/associations-network/articles/106732

  const waypointTypeIcons = {};

  for (const type of constants.waypoint_types) {
    waypointTypeIcons[type] = icon({ prefix: 'waypoint', iconName: type });
  }

  export default {
    data() {
      return {
        loading: false,
        data: {
          nodes: [],
          links: []
        },
        total: 0,
        loaded: 0,

        selectedDocument: null,

        depth: 2,
        colorScheme: 'quality',

        chargeStrength: -80,
        chargeDistanceMin: 40,
        chargeDistanceMax: 200,
        collideStrength: 1,
        collideRadius: 12,
        linkDistance: 50,

        includes: ['article'],

        excludedDocumentIds: '108793',
        crawlMarkdownLinkInLang: null
      };
    },

    documentTypes: {
      area: {
        icon: icon({ iconName: 'globe-americas' })
      },
      article: {
        icon: icon({ iconName: 'newspaper' })
      },
      book: {
        icon: icon({ iconName: 'atlas' })
      },
      image: {
        icon: icon({ iconName: 'image' })
      },
      map: {
        icon: icon({ iconName: 'map' })
      },
      outing: {
        icon: icon({ prefix: 'document-type', iconName: 'outing' })
      },
      profile: {
        icon: icon({ iconName: 'user' })
      },
      route: {
        icon: icon({ iconName: 'route' })
      },
      waypoint: {
        icon: icon({ iconName: 'map-marker-alt' })
      },
      xreport: {
        icon: icon({ iconName: 'flag-checkered' })
      }
    },

    constants,
    documentCache: {},
    simulation: null,

    watch: {
      '$route': {
        handler: 'load',
        immediate: true
      },
      chargeStrength: 'updateSimulation',
      chargeDistanceMin: 'updateSimulation',
      chargeDistanceMax: 'updateSimulation',
      collideStrength: 'updateSimulation',
      collideRadius: 'updateSimulation',
      linkDistance: 'updateSimulation'
    },

    mounted() {
      const d3script = document.createElement('script');
      d3script.setAttribute('src', 'https://d3js.org/d3.v4.js');
      document.head.appendChild(d3script);
    },

    methods: {
      load() {
        this.loading = true;
        const documentType = this.$route.params.documentType.slice(0, -1);
        const documentId = parseInt(this.$route.params.id);

        const data = {
          nodes: {},
          links: {}
        };

        this.total = 0;
        this.loaded = 0;

        this.getDocument(documentType, documentId, data, 0);
      },

      getDocument(documentType, documentId, data, depth) {
        if (data.nodes[documentId] !== undefined) {
          return;
        }

        this.total += 1;

        const lang = this.crawlMarkdownLinkInLang || 'fr';
        const cacheKey = `${documentId}#${lang}`;

        if (this.$options.documentCache[cacheKey] === undefined) {
          c2c[documentType].getCooked(documentId, lang)
            .then(response => {
              this.$options.documentCache[cacheKey] = response.data;
              this.processDocument(documentType, documentId, data, depth, response.data);
            })
            .catch(response => {
              data.nodes[documentId] = this.getNodeFromDocument(documentId, null);
              this.loaded += 1;
          });
        } else {
          this.processDocument(documentType, documentId, data, depth, this.$options.documentCache[cacheKey]);
        }
      },

      processDocument(documentType, documentId, data, depth, document) {
        if (document.redirects_to) {
          // clean links
          const links = {};
          for (const link of Object.values(data.links)) {
            if (link.target === documentId) {
              link.target = document.redirects_to;
            } else if (link.source === documentId) {
              link.source = document.redirects_to;
            }
            links[this.getLinkKey(link.source, link.target)] = link;
          }

          data.links = links;

          this.getDocument(documentType, document.redirects_to, data, depth);
        } else {
          data.nodes[documentId] = this.getNodeFromDocument(documentId, document);

          if (depth < parseInt(this.depth) && !this.excludedDocumentIds.split(',').includes(String(documentId))) {
            this.addLinksFromAssociations(document, data, depth + 1);
            this.addLinksFromCooked(document, data, depth + 1);
          }
        }

        this.loaded += 1;
        if (this.loaded === this.total) {
          this.loading = false;
          this.createNetwork(data);
        }
      },

      // Links crawlers
      addLinksFromAssociations(document, data, depth) {
        this.addLinks(document, document.areas, data, depth);
        if (document.associations) {
          for (const item of Object.values(document.associations)) {
            this.addLinks(document, item, data, depth);
          }
        }
      },

      addLinksFromCooked(document, data, depth) {
        if (document.cooked && document.cooked.lang === this.crawlMarkdownLinkInLang) {
          const div = window.document.createElement('div');
          div.innerHTML = document.cooked.description;

          for (const anchor of div.getElementsByTagName('a')) {
            this.addLinkFromAnchor(document, anchor, data, depth);
          }
        }
      },

      addLinkFromAnchor(document, anchor, data, depth) {
        let documentType = null;
        let documentId = null;

        if (anchor.attributes['c2c:role'] && anchor.attributes['c2c:role'].value === 'internal-link') {
          documentType = anchor.attributes['c2c:document-type'].value;
          documentId = parseInt(anchor.attributes['c2c:document-id'].value);
        } else if (anchor.attributes['href'] === undefined || anchor.attributes['href'].value.startsWith('#')) {
          return;
        } else {
          let href = anchor.attributes.href.value;

          let temp = window.location.href.split('/')[0];
          const currentHost = temp[0] + '//' + temp[2];

          if (!href.startsWith('https://www.camptocamp.org') && !href.startsWith(currentHost)) {
            return;
          }

          href = href.replace(currentHost, '');
          href = href.replace('https://www.camptocamp.org', '');
          temp = href.split('/');

          if (temp.length < 3) {
            return;
          }
          documentType = temp[1];
          documentId = parseInt(temp[2]);
        }

        documentType = documentType.substring(0, documentType.length - 1);
        if (!isNaN(documentId)) {
          this.addLink(document, documentType, documentId, data, depth);
        }
      },

      // Generic link tools
      addLinks(parentDocument, associationList, data, depth) {
        if (associationList === undefined) {
          return;
        }
        if (associationList.documents !== undefined) {
          associationList = associationList.documents;
        }

        for (const item of associationList) {
          const childType = this.$documentUtils.getDocumentType(item.type);
          this.addLink(parentDocument, childType, item.document_id, data, depth);
        }
      },

      addLink(parent, childType, childId, data, depth) {
        if (!this.includes.includes(childType)) {
          return;
        }

        const key = this.getLinkKey(parent.document_id, childId);

        if (data.links[key] === undefined) {
          data.links[key] = { source: parent.document_id, target: childId };
        }

        this.getDocument(childType, childId, data, depth);
      },

      getLinkKey(parentId, childId) {
        return childId < parentId ? `${childId}_${parentId}` : `${parentId}_${childId}`;
      },

      // Object builders
      getNodeFromDocument(documentId, document) {
        let nodeIcon = icon({ iconName: 'bomb' });

        const result = {
          id: documentId,
          documentType: 'notfound',
          documentSubType: 'notfound',
          licence: 'collab',
          document: null
        };

        if (document) {
          result.document = document;
          result.documentType = this.$documentUtils.getDocumentType(document.type);
          result.licence = document.article_type ? document.article_type : 'collab';
          result.quality = document.quality;

          if (document.type === 'c') {
            result.documentSubType = document.categories[0];
          } else if (document.type === 'w') {
            result.documentSubType = document.waypoint_type;
          } else {
            result.documentSubType = 'unknown';
          }

          if (document.type === 'w') {
            nodeIcon = waypointTypeIcons[document.waypoint_type];
          } else {
            nodeIcon = this.$options.documentTypes[this.$documentUtils.getDocumentType(document.type)].icon;
          }
        }

        result.iconScale = `scale(${12 / nodeIcon.icon[1]})`;
        result.iconPath = nodeIcon.icon[4];

        return result;
      },

      // simulation tools
      updateSimulation() {
        this.setSimulationParams();
        this.$options.simulation.alpha(0.5).restart();
      },

      setSimulationParams() {
        this.$options.simulation.force('charge')
          .strength(parseInt(this.chargeStrength))
          .distanceMin(parseInt(this.chargeDistanceMin))
          .distanceMax(parseInt(this.chargeDistanceMax));

        this.$options.simulation.force('collide')
          .strength(parseInt(this.collideStrength))
          .radius(parseInt(this.collideRadius));

        this.$options.simulation.force('link')
          .distance(parseInt(this.linkDistance));
      },

      handleClick(d) {
        this.selectedDocument = d.document;
      },

      createNetwork(data) {
        const d3 = window.d3;

        const dragstarted = d => {
          if (!d3.event.active) this.$options.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        };

        const dragged = d => {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        };

        const dragended = d => {
          if (!d3.event.active) this.$options.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        };

        const graph = {
          nodes: Object.values(data.nodes),
          links: Object.values(data.links)
        };

        this.data = graph;

        const svgBoundingClientRect = this.$refs.svg.getBoundingClientRect();
        const width = svgBoundingClientRect.width;
        const height = svgBoundingClientRect.height;
        const svg = d3.select(this.$refs.svg);
        this.$options.simulation = d3.forceSimulation();

        svg.selectAll('*').remove();

        this.$options.simulation.nodes(graph.nodes);

        this.$options.simulation
          // .force("link", d3.forceLink(graph.links).id(d => d.id).distance(0).strength(1))
          .force('link', d3.forceLink(graph.links).id(d => {
            return d.id;
          }))
          .force('charge', d3.forceManyBody())
          .force('collide', d3.forceCollide())
          .force('center', d3.forceCenter(width / 2, height / 2))
          .on('tick', ticked);

        this.setSimulationParams();

        this.$options.simulation.force('link').links(graph.links);

        const link = svg.append('g')
          .style('stroke', '#aaa')
          .selectAll('line')
          .data(graph.links)
          .enter().append('line');

        const node = svg.selectAll('.node')
          .data(graph.nodes)
          .enter()
          .append('g')
          .attr('class', d => `node subtype-${d.documentSubType} licence-${d.licence} quality-${d.quality}`)
          .on('click', this.handleClick)
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

        node.append('circle')
          .attr('r', 11)
          .attr('transform', 'translate(6.5, 6.5)');

        node.append('path')
          .attr('d', d => d.iconPath)
          .attr('transform', d => d.iconScale);

        node.append('title').text(d => {
          return d.document ? this.$documentUtils.getDocumentTitle(d.document) : `ERROR 404: ${d.id}`;
        });

        function ticked() {
          link
            .attr('x1', (d) => {
              return d.source.x;
            })
            .attr('y1', (d) => {
              return d.source.y;
            })
            .attr('x2', (d) => {
              return d.target.x;
            })
            .attr('y2', (d) => {
              return d.target.y;
            });

          node.attr('transform', (d) => {
            return 'translate(' + (d.x - 6) + ',' + (d.y - 6) + ')';
          });
        }
      }
    }
  };

</script>

<style scoped lang="scss">
  .network-graph {
    background: white;
    border: 1px solid lightgrey;
    width: 100%;
  }

  .select {
    width: 100%;
    select {
      width: 100%;
    }
  }

  .range-input{
    width: 100%;
  }
</style>

<style lang="scss">
  .network-graph {
    .node path {
      fill: white;
    }

    .node.subtype-notfound path {
      fill: red;
    }
  }
  .network-graph.subtype {
    .subtype-site_info circle {
      fill: green;
    }
    .subtype-mountain_environment circle {
      fill: blue;
    }
    .subtype-gear circle {
      fill: brown;
    }
    .subtype-technical circle {
      fill: red;
    }
    .subtype-topoguide_supplements circle {
      fill: purple;
    }
    .subtype-soft_mobility circle {
      fill: darkred;
    }
    .subtype-expeditions circle {
      fill: pink;
    }
    .subtype-stories circle {
      fill: orange;
    }
    .subtype-c2c_meetings circle {
      fill: grey;
    }
    .subtype-tags circle {
      fill: cyan;
    }
    .subtype-site_info circle {
      fill: green;
    }
    .subtype-association circle {
      fill: magenta;
    }

    // Waypoints
    .subtype-access circle {
      fill: magenta;
    }
    .subtype-shelter circle {
      fill: green;
    }
    .subtype-hut circle {
      fill: cyan;
    }
    .subtype-webcam circle {
      fill: grey;
    }
    .subtype-bivouac circle {
      fill: orange;
    }
    .subtype-summit circle {
      fill: blue;
    }
    .subtype-virtual circle {
      fill: pink;
    }
  }

  .network-graph.quality {
    .quality-empty circle {
      fill: purple;
    }

    .quality-draft circle {
      fill: red;
    }

    .quality-medium circle {
      fill: orange;
    }

    .quality-fine circle {
      fill: lightgreen;
    }

    .quality-great circle {
      fill: darkgreen;
    }
  }

  .network-graph {
    .node {
      cursor: pointer;
    }

    .licence-personal {
      fill-opacity: 0.25;
    }
  }
</style>
