export default {
  /** Format time for displaying : YYYYMMDDTHHMMSS -> HH:MM */
  formatTime(dateTimeString) {
    if (!dateTimeString) return '';
    return dateTimeString.substring(9, 11) + ':' + dateTimeString.substring(11, 13);
  },

  /** Format duration for displaying : h / min */
  formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} h ${minutes > 0 ? minutes + ' min' : ''}`;
    }
    return `${minutes} min`;
  },

  /** Gets icons according to the nature of the transport */
  getTransportIcon(section) {
    if (!section.display_informations) return '';

    const mode = section.display_informations.commercial_mode?.toLowerCase() || '';
    if (mode.includes('bus')) return 'bus';
    if (mode.includes('tram')) return 'tram';
    if (mode.includes('métro') || mode.includes('metro')) return 'tram';
    if (mode.includes('train')) return 'train';
    if (mode.includes('car')) return 'bus';

    return 'bus';
  },

  /** Manage different spellings of transports */
  getTransportClass(section) {
    if (!section.display_informations) return '';

    const mode = section.display_informations.commercial_mode?.toLowerCase() || '';

    if (mode.includes('bus')) return 'bus';
    if (mode.includes('tram')) return 'tram';
    if (mode.includes('métro') || mode.includes('metro')) return 'tram';
    if (mode.includes('train')) return 'train';
    if (mode.includes('car')) return 'bus';

    return 'bus';
  },

  /** Method to calculate distance in meters */
  getDistance(section) {
    if (section.distance) {
      return Math.round(section.distance);
    }
    return section.path && section.path.length > 0
      ? Math.round(section.path.reduce((acc, step) => acc + (step.length || 0), 0))
      : 0;
  },

  /** Method to get accessibility icons */
  getAccessibilityIcon(section) {
    if (!section.display_informations || !section.display_informations.equipments) {
      return {
        bike: false,
        wheelchair: false,
      };
    }

    return {
      bike: section.display_informations.equipments.includes('has_bike_accepted'),
      wheelchair: section.display_informations.equipments.includes('has_wheelchair'),
    };
  },

  /** Each route follows the same sequence of colors */
  getRouteColor(section) {
    if (section.mode === 'walking') return '00008B';
    if (section.type === 'public_transport' || section.type === 'on_demand_transport') {
      const color = section.display_informations?.color;
      return color === 'FFFFFF' ? '808080' : color || '808080';
    }
    return '808080';
  },

  /** Creates the class based on color */
  getTransportColorClass(section) {
    if (section.display_informations?.color) {
      return 'transport-color-' + section.display_informations.color.replace('#', '');
    }
    return 'transport-color-default';
  },

  /** Formats the journey time in minutes and hours */
  formatJourneyDuration(seconds) {
    if (!seconds && seconds !== 0) return '';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  },

  /** Get section duration directly when available, fallback to 0 */
  calculateSectionDuration(section) {
    if (section.duration !== undefined && section.duration !== null) {
      return section.duration;
    }
    return 0;
  },
};
