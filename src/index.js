import uuid from 'uuid/v4'

export default function (modelDef) {
  const {modelName,
       fields,
       listName,
       replication
	} = modelDef

  const listProperName = listName[0].toUpperCase() + listName.substring(1)
  const modelListName = modelName + 'List'
  const listCapitalName = listName.toUpperCase()
  const modelProperName = modelName[0].toUpperCase() + modelName.substring(1)
  const modelCapitalName = modelName.toUpperCase()
  const routesName = modelName + 'Routes'
  const templatesName = modelName + 'Templates'
  const modelDefinitionName = modelName + 'ModelDef'

  let fieldNames = Object.keys(fields)
  const SELECT = `SELECT_${modelCapitalName}`
  const DESELECT = `DESELECT_${modelCapitalName}`
  const SAVE = `SAVE_${modelCapitalName}`
  const LOAD = `LOAD_${listCapitalName}`
  const STORE = `STORE_${modelCapitalName}`
  const DELETE = `DELETE_${modelCapitalName}`
  const SET_ROUTE = `SET_ROUTE_${modelCapitalName}`
  const DELETE_ROUTE = `DELETE_ROUTE_${modelCapitalName}`
  const SET_TEMPLATE = `SET_TEMPLATE_${modelCapitalName}`
  const DELETE_TEMPLATE = `DELETE_TEMPLATE_${modelCapitalName}`
  const SET_MODEL_DEF = `SET_COMPOENET_DEF_${modelCapitalName}`
  const SAVE_RELATION = `SAVE_RELATION`
  const DELETE_RELATION = `DELETE_RELATION`

  const actions = {}
  const reducers = {}

  actions[`select${modelProperName}`] = (model) =>{
    return {type: SELECT, model}
  }
  actions[`deselect${modelProperName}`] = () =>{
    return {type: DESELECT}
  }
  actions[`save${modelProperName}`] = (model) =>{
    return {type: SAVE, model}
  }
  actions[`load${listProperName}`] = (list) =>{
    return {type: LOAD, list}
  }
  actions[`store${modelProperName}`] = (model) =>{
    return {type: STORE, model}
  }
  actions[`delete${modelProperName}`] = (model) =>{
    return {type: DELETE, model}
  }
  actions[`setRoute${modelProperName}`] = (routeDef) =>{
    return {type: SET_ROUTE, ...routeDef}
  }
  actions[`deleteRoute${modelProperName}`] = (routeDef) =>{
    return {type: DELETE_ROUTE, ...routeDef}
  }
  actions[`setTemplate${modelProperName}`] = (templateDef) =>{
    return {type: SET_TEMPLATE, ...templateDef}
  }
  actions[`deleteTemplate${modelProperName}`] = (templateDef) =>{
    return {type: DELETE_TEMPLATE, ...templateDef}
  }
  actions[`setModelDef${modelProperName}`] = (def) =>{
    return {type: SET_MODEL_DEF, modelDef: def}
  }

  if (fieldNames.length > 0) {
    for (let fieldName of fieldNames) {
      const fieldDef = fields[fieldName]
      const relationName = fieldDef.relation
      if (relationName) {
	const relationProperName = relationName[0].toUpperCase() + relationName.substring(1)
	actions[`save${modelProperName}${relationProperName}`] = (id) =>{
	  return {type: SAVE_RELATION, fieldName, id}
	}
	actions[`delete${modelProperName}${relationProperName}`] = (id) =>{
	  return {type: DELETE_RELATION, fieldName, id}
	}
      }
    }
  }

  reducers[modelDefinitionName] = (state = {}, action) =>{
    switch (action.type) {
    case SET_MODEL_DEF: {
      return action.modelDef
    }
    default: return state
    }
  }

  reducers[routesName] = (state = {}, action) =>{
    switch (action.type) {
    case SET_ROUTE: {
      const {name, path} = action
      let route = {}
      route[name] = path
      return Object.assign({}, state, route)
    }
    case DELETE_ROUTE: {
      const {name} = action
      const next = Object.assign({}, state)
      delete next[name]
      return next
    }
    default : return state
    }
  }

  reducers[templatesName] = (state = {}, action) =>{
    switch (action.type) {
    case SET_TEMPLATE: {
      const {name, template} = action
      let temp = {}
      temp[name] = template
      return Object.assign({}, state, temp)
    }
    case DELETE_TEMPLATE: {
      const {name} = action
      const next = Object.assign({}, state)
      delete next[name]
      return next
    }
    default : return state
    }
  }

  reducers[modelName] = (state = {isValid: false}, action) =>{
    switch (action.type) {
    case SELECT: {
      return action.model
    }
    case DESELECT: {
      return {}
    }
    case SAVE: {
      const next = JSON.parse(JSON.stringify(action.model))
      next.isValid = true
      for (let fieldName of fieldNames) {
	const value = String(action.model[fieldName])
	const validators = fields[fieldName].validate
	if (validators && validators.length > 0) {
	  next.isValid= true
	  next[`${fieldName}Error`] = []
	  for (let validator of validators) {
	    const valid = validator.func(value, validator.params)
	    if (!valid) {
	      next.isValid = false
	      next[`${fieldName}Error`].push(validator.message)
	    }
	  }
	  if (next.isValid && next[`${fieldName}Error`]) {
	    delete next[`${fieldName}Error`]
	  }
	}
      }
      return next
    }
    case SAVE_RELATION: {
      const {fieldName, id} = action
      if (!id) {
	return state
      }
      const next = Object.assign({}, state)
      next[fieldName] = Object.assign({}, state[fieldName])
      if (!next[fieldName]) {
	next[fieldName] = {}
      }
      next[fieldName][id] = id
      return next
    }
    case DELETE_RELATION: {
      const next = Object.assign({}, state)
      const {fieldName, id} = action
      next[fieldName] = Object.assign({}, state[fieldName])
      delete next[fieldName][id]
      return next
    }
    default: return state
    }
  }

  reducers[modelListName] = (state = {}, action) =>{
    switch (action.type) {
    case LOAD: {
      return action.list
    }
    case STORE: {
       let id = ''
      const next = {...state}
      if (action.model.uuid) {
	id = action.model.uuid
	next[id] = Object.assign({}, action.model, {uuid: id})
      } else { id = uuid() }
      next[id] = Object.assign({}, action.model, {uuid: id})
      return next
    }
    case DELETE: {
      const next = Object.assign({}, state)
      delete next[action.model.uuid]
      return next
    }
    default: {
      return state
    }
    }
  }

  const provider = {
    actions,
    reducers,
    replication
  }
  return provider
}
