import { logToUI } from '../utils/logger';

type VariableScope =
  | 'ALL_SCOPES'
  | 'TEXT_COLOR'
  | 'BG_COLOR'
  | 'FILL_COLOR'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR'
  | 'OPACITY'
  | 'FONT_FAMILY'
  | 'FONT_SIZE'
  | 'FONT_WEIGHT'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'PARAGRAPH_SPACING'
  | 'PARAGRAPH_INDENT'
  | 'BORDER_RADIUS'
  | 'SPACING'
  | 'DIMENSION'
  | 'GAP'
  | 'SIZING_WIDTH'
  | 'SIZING_HEIGHT';

// Get all variables from the file
export const getVariables = async () => {
  try {
    const variables = figma.variables.getLocalVariables();
    const collections = figma.variables.getLocalVariableCollections();

    const result = {
      variables: variables.map((v) => ({
        id: v.id,
        name: v.name,
        type: v.resolvedType,
        valuesByMode: v.valuesByMode,
        scopes: v.scopes,
        description: v.description || '',
        hiddenFromPublishing: v.hiddenFromPublishing,
      })),
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        modes: c.modes,
        variableIds: c.variableIds,
      })),
    };

    logToUI(
      `Retrieved ${variables.length} variables and ${collections.length} collections`
    );
    figma.notify(`Retrieved ${variables.length} variables`);

    // Send variables back to server (could be enhanced to return via API)
    console.log('Variables:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error getting variables:', error);
    logToUI(
      `Error getting variables: ${
        error instanceof Error ? error.message : String(error)
      }`,
      'error'
    );
    figma.notify('Error getting variables', { error: true });
  }
};

// Create a new variable
export const createVariable = async (data: {
  name: string;
  variableType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, unknown>;
  collectionId?: string;
  description?: string;
  scopes?: VariableScope[];
}) => {
  try {
    const {
      name,
      variableType,
      valuesByMode,
      collectionId,
      description,
      scopes,
    } = data;

    // Get or create collection
    let collection: VariableCollection;
    if (collectionId) {
      const collections = figma.variables.getLocalVariableCollections();
      const foundCollection = collections.find((c) => c.id === collectionId);
      if (!foundCollection) {
        throw new Error(`Collection with id ${collectionId} not found`);
      }
      collection = foundCollection;
    } else {
      // Use existing collection or create default
      const collections = figma.variables.getLocalVariableCollections();
      collection =
        collections.length > 0
          ? collections[0]
          : figma.variables.createVariableCollection('Default');
      if (!collection) {
        throw new Error('Failed to create or find variable collection');
      }
    }

    // Get first mode ID for variable creation
    const firstModeId = collection.modes[0]?.modeId;
    if (!firstModeId) {
      throw new Error('Collection must have at least one mode');
    }

    // Get first value for initial creation
    const firstValue = valuesByMode[firstModeId];
    if (firstValue === undefined) {
      // Try to get any value from valuesByMode
      const modeIds = Object.keys(valuesByMode);
      if (modeIds.length === 0) {
        throw new Error('At least one value must be provided');
      }
      const anyValue = valuesByMode[modeIds[0]];
      if (anyValue === undefined) {
        throw new Error('At least one value must be provided');
      }
    }

    // Create variable with first mode value
    const variable = figma.variables.createVariable(
      name,
      collection,
      variableType
    );

    // Set values for all modes
    const modeEntries = Object.keys(valuesByMode).map(
      (key) => [key, valuesByMode[key]] as [string, unknown]
    );
    for (const [modeId, value] of modeEntries) {
      // Verify mode exists in collection
      const modeExists = collection.modes.some((m) => m.modeId === modeId);
      if (modeExists) {
        variable.setValueForMode(modeId, value as VariableValue);
      } else {
        console.warn(`Mode ${modeId} not found in collection, skipping`);
      }
    }

    // Set description
    if (description) {
      variable.description = description;
    }

    // Set scopes
    if (scopes && scopes.length > 0) {
      variable.scopes = scopes as never;
    }

    logToUI(`Created variable: ${name}`);
    figma.notify(`Created variable: ${name}`);
  } catch (error) {
    console.error('Error creating variable:', error);
    logToUI(
      `Error creating variable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      'error'
    );
    figma.notify('Error creating variable', { error: true });
  }
};

// Update an existing variable
export const updateVariable = async (data: {
  variableId: string;
  name?: string;
  valuesByMode?: Record<string, unknown>;
  description?: string;
  scopes?: VariableScope[];
}) => {
  try {
    const { variableId, name, valuesByMode, description, scopes } = data;

    const variable = figma.variables.getVariableById(variableId);
    if (!variable) {
      throw new Error(`Variable with id ${variableId} not found`);
    }

    // Update name
    if (name !== undefined) {
      variable.name = name;
    }

    // Update values by mode
    if (valuesByMode) {
      const modeEntries = Object.keys(valuesByMode).map(
        (key) => [key, valuesByMode[key]] as [string, unknown]
      );
      for (const [modeId, value] of modeEntries) {
        variable.setValueForMode(modeId, value as VariableValue);
      }
    }

    // Update description
    if (description !== undefined) {
      variable.description = description;
    }

    // Update scopes
    if (scopes !== undefined) {
      variable.scopes = scopes as never;
    }

    logToUI(`Updated variable: ${variable.name}`);
    figma.notify(`Updated variable: ${variable.name}`);
  } catch (error) {
    console.error('Error updating variable:', error);
    logToUI(
      `Error updating variable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      'error'
    );
    figma.notify('Error updating variable', { error: true });
  }
};

// Delete a variable
export const deleteVariable = async (data: { variableId: string }) => {
  try {
    const { variableId } = data;

    const variable = figma.variables.getVariableById(variableId);
    if (!variable) {
      throw new Error(`Variable with id ${variableId} not found`);
    }

    const variableName = variable.name;
    variable.remove();

    logToUI(`Deleted variable: ${variableName}`);
    figma.notify(`Deleted variable: ${variableName}`);
  } catch (error) {
    console.error('Error deleting variable:', error);
    logToUI(
      `Error deleting variable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      'error'
    );
    figma.notify('Error deleting variable', { error: true });
  }
};

