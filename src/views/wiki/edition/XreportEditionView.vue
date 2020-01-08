<template>
  <edition-container
    :mode="mode"
    :document="document"
    :generic-errors="genericErrors"
    :is-loading="saving"
    @save="save">

    <form-section
      :title="$gettext('General information')"
      :sub-title="$gettext('Report title, activity, linked routes or outings.')">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.title" />
        <form-field class="is-12" :document="document" :field="fields.activities" :single-select="true" />
      </div>

      <associations-input-row :document="document" :field="fields.articles" />
      <associations-input-row :document="document" :field="fields.routes" />
      <associations-input-row :document="document" :field="fields.outings" />

    </form-section>

    <form-section :title="$gettext('Anonymity and confidentiality')">
      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.anonymous" />
        <form-field class="is-6" :document="document" :field="fields.disable_comments" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Geolocation')"
      :sub-title="$gettext('Precise location of the event.')">

      <div class="columns is-multiline">
        <form-field class="is-3" :document="document" :field="fields.elevation" />
      </div>

      <map-input-row :document="document" />
    </form-section>

    <form-section
      :title="$gettext('Participants and context')"
      :sub-title="$gettext('Details on participants and event context')">
      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.date" />
        <form-field class="is-4" :document="document" :field="fields.nb_participants" />
        <form-field class="is-12" :document="document" :field="fields.event_type" :single-select="true" />
        <form-field class="is-4" :document="document" :field="fields.nb_impacted" />
        <form-field class="is-4" :document="document" :field="fields.severity" />
        <form-field class="is-4" :document="document" :field="fields.rescue" />

        <form-field class="is-4" :document="document" :field="fields.avalanche_level" />
        <form-field class="is-4" :document="document" :field="fields.avalanche_slope" />
      </div>
      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.age" />
        <form-field class="is-4" :document="document" :field="fields.gender" />
        <form-field class="is-4" :document="document" :field="fields.author_status" />
        <form-field class="is-4" :document="document" :field="fields.autonomy" />
        <form-field class="is-4" :document="document" :field="fields.activity_rate" />
        <form-field class="is-4" :document="document" :field="fields.supervision" />
        <form-field class="is-4" :document="document" :field="fields.qualification" />
        <form-field class="is-4" :document="document" :field="fields.previous_injuries" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Narration')"
      :sub-title="$gettext('Open fields to deeply explain the event circumstances.')">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.summary" />
        <form-field class="is-12" :document="document" :field="fields.description" :placeholder="$gettext('Details of the actual outing and the incident. If you have already written up your outing, you only need to describe the incident, then link it to your outing report (after first uploading it)')" />
        <form-field class="is-12" :document="document" :field="fields.place" :placeholder="$gettext('Information on the location of the incident. Mark the location on the map above, even if you cannot do very accurately, (in which case give more details here). After completing the report, you can associate it to a route, a climbing site or an outing.')" />
        <form-field class="is-12" :document="document" :field="fields.route_study" :placeholder="$gettext('Map, guidebook, known route, planning for a plan B, (re) evaluation of route during trip?')" />
        <form-field class="is-12" :document="document" :field="fields.conditions" :placeholder="$gettext('Describe the information gathered before the outing and how these evolved once on route: weather forecast, avalanche risk reports, amount of refreezing, condition of the snow/ice/rock, reports from the previous days, etc.')" />
        <form-field class="is-12" :document="document" :field="fields.training" :placeholder="$gettext('Please describe your technical and experience level related to the chosen goal, your level of fitness, prior tiredness accumulated, acclimatization if in altitude, etc.')" />
        <form-field class="is-12" :document="document" :field="fields.motivations" :placeholder="$gettext('Why did you choose this outing? When did you decide to engage. What influenced your decision (holiday time, long journey, hotel/hut bookings, time spent already in preparation, limited possibilities, etc.)?')" />
        <form-field class="is-12" :document="document" :field="fields.group_management" :placeholder="$gettext('Communication of the individual objectives and expectations, the thoughts and observations during the outing, discussions on new strategies, the way the group conducted itself and divided responsibilities, was the group used to working together, core aspirations, etc.')" />
        <form-field class="is-12" :document="document" :field="fields.risk" :placeholder="$gettext('Have you (re)evaluated the risks at each change in the situation? What factors might have affected your awareness, such as tiredness, stress, relaxing having passed the main difficulties or on the descent, on a section reputed to be easy, presence of footprints or other people, complete confidence in the leader of the group, etc.')" />
        <form-field class="is-12" :document="document" :field="fields.time_management" :placeholder="$gettext('Had a timetable for the route been foreseen? Did you maintain the schedule? Was time a factor in causing the incident?')" />
        <form-field class="is-12" :document="document" :field="fields.safety" :placeholder="$gettext('Types of belay and protection used, verifications between climbers, snowpack stability tests, testing of avalanche transceivers, etc.')" />
        <form-field class="is-6" :document="document" :field="fields.reduce_impact" />
        <form-field class="is-6" :document="document" :field="fields.increase_impact" />
        <form-field class="is-6" :document="document" :field="fields.modifications" :placeholder="$gettext('Has this experience changed your habits? Describe the lessons you have learned from this experience')" />
        <form-field class="is-6" :document="document" :field="fields.other_comments" :placeholder="$gettext('Briefly describe any injuries. Comments that do not fit into any other fields can be entered here.')" />
      </div>
    </form-section>

  </edition-container>
</template>

<script>

  import documentEditionViewMixin from './utils/document-edition-view-mixin';

  export default {
    mixins: [ documentEditionViewMixin ]
  };

</script>
